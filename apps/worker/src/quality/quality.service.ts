import { Injectable, Logger } from '@nestjs/common';
import { InjectAppConfig, AppConfigType } from '@verified-prof/config';
import { VcsProviderFactory } from '../providers/vcs-provider.factory';
import { PLAN_POLICIES, ListCommitsOptions } from '@verified-prof/shared';
import {
  QualityAnalysisRequest,
  QualityAnalysisResponse,
  DomainConfig,
  QualityWeightingProfile,
  CommitData,
} from '@verified-prof/shared';
import {
  CommitScorerService,
  QualityMetricsResult,
} from './services/commit-scorer.service';
import { AntiGamingDetectorService } from './services/anti-gaming-detector.service';
import { RepoAllocatorService } from './services/repo-allocator.service';
import { PersistenceService } from './services/persistence.service';
import { TemporalAnalyzerService } from './services/temporal-analyzer.service';
import { QualityExplanationService } from '../ai/services/quality-explanation.service';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(
    @InjectAppConfig() private readonly config: AppConfigType,
    private readonly providerFactory: VcsProviderFactory,
    private readonly commitScorer: CommitScorerService,
    private readonly antiGamingDetector: AntiGamingDetectorService,
    private readonly repoAllocator: RepoAllocatorService,
    private readonly persistence: PersistenceService,
    private readonly temporalAnalyzer: TemporalAnalyzerService,
    private readonly qualityExplanation: QualityExplanationService,
  ) {}

  /**
   * Analyzes all repositories for a user according to plan policy.
   * Lists repositories, filters by activity window, allocates commits per repo.
   */
  async analyzeUserRepos(userId: string, plan: 'FREE' | 'PREMIUM' = 'FREE') {
    const policy = PLAN_POLICIES[plan];

    const provider = await this.providerFactory.createProviderForUser(userId);
    const repos = await provider.getUserRepositories(userId, {
      perPage: 2,
      page: 1,
    });
    const since = new Date(
      Date.now() - policy.windowDays * 24 * 60 * 60 * 1000,
    );
    const results: Array<{
      repository: string;
      result: QualityAnalysisResponse | unknown;
    }> = [];

    const repoInfos = repos.map((repo) => ({
      fullName: repo.fullName,
      language: repo.language || null,
      pushedAt: repo.pushedAt || null,
      stars: repo.stargazers || 0,
      forks: repo.forks || 0,
      openIssues: 0,
    }));

    const allocationResult = this.repoAllocator.computeRepoAllocations(
      repoInfos,
      policy.maxCommits,
    );

    for (const repo of repos) {
      const owner = repo.ownerUsername || repo.fullName.split('/')[0];
      const repoName = repo.name;
      const params: QualityAnalysisRequest = {
        userId,
        owner,
        repo: repoName,
        since,
        branch: repo.defaultBranch,
      };

      const perRepoMax = allocationResult.allocations[repo.fullName] || 0;
      if (perRepoMax <= 0) continue;
      const res = await this.analyzeRepository(params, {
        maxCommits: perRepoMax,
      });
      results.push({ repository: `${owner}/${repoName}`, result: res });

      const analyzedCommits = results.reduce(
        (s, r) =>
          s +
          (('result' in r &&
            (r.result as QualityAnalysisResponse).commitsAnalyzed) ||
            0),
        0,
      );
      if (analyzedCommits >= policy.maxCommits) break;
    }

    return {
      userId,
      plan: policy.plan,
      windowDays: policy.windowDays,
      repositoriesAnalyzed: results.length,
      repositories: results,
    };
  }

  async analyzeRepository(
    params: QualityAnalysisRequest,
    options?: { maxCommits?: number },
  ): Promise<QualityAnalysisResponse> {
    const provider = await this.providerFactory.createProviderForUser(
      params.userId,
    );

    // fetch commits with pagination if maxCommits provided
    let commits: Array<CommitData> = [];
    if (options?.maxCommits && options.maxCommits > 0) {
      const perPage = Math.min(100, options.maxCommits);
      let page = 1;
      while (commits.length < options.maxCommits) {
        const partial = await provider.listCommits(params.owner, params.repo, {
          since: params.since,
          until: params.until,
          branch: params.branch,
          perPage,
          page,
        });
        if (!partial || partial.length === 0) break;
        commits.push(...partial);
        if (partial.length < perPage) break;
        page += 1;
      }
      commits = commits.slice(0, options.maxCommits);
    } else {
      const listOptions: ListCommitsOptions = {
        since: params.since,
        until: params.until,
        branch: params.branch,
        perPage: 100,
        page: 1,
      };
      commits = await provider.listCommits(
        params.owner,
        params.repo,
        listOptions,
      );
    }
    const domainType = params.domainType || 'backend';
    const domainConfig: DomainConfig = (
      this.config.quality.domains as Record<string, DomainConfig>
    )[domainType];

    const weights: QualityWeightingProfile = {
      userId: params.userId,
      profileName: 'default',
      isActive: false,
      maxLinesPerCommit: domainConfig.maxLinesPerCommit,
      maxFilesPerCommit: domainConfig.maxFilesPerCommit,
      minLinesForReview: domainConfig.minLinesForReview,
      disciplineWeight: this.config.quality.defaultWeights.disciplineWeight,
      clarityWeight: this.config.quality.defaultWeights.clarityWeight,
      impactWeight: this.config.quality.defaultWeights.impactWeight,
      consistencyWeight: this.config.quality.defaultWeights.consistencyWeight,
      primaryLanguages: domainConfig.primaryLanguages,
      frameworkContext: domainConfig.frameworkContext,
    } as QualityWeightingProfile;

    const trivialThreshold =
      this.config.quality.antiGaming.trivialLinesThreshold;

    const metricsResults: QualityMetricsResult[] = [];
    for (const commit of commits) {
      const result = this.commitScorer.calculateCommitQuality(
        commit as CommitData,
        domainConfig,
        weights,
        trivialThreshold,
      );
      metricsResults.push(result);
    }

    this.logger.log(
      `Analyzed ${metricsResults.length} commits for ${params.owner}/${params.repo}`,
    );

    // Generate AI explanations for commits (optional, can be disabled via config)
    if (metricsResults.length > 0 && metricsResults.length <= 20) {
      try {
        this.logger.debug('Generating AI explanations for quality scores...');
        await Promise.all(
          metricsResults.slice(0, 5).map(async (metrics) => {
            const commit = commits.find((c) => c.sha === metrics.commitSha);
            if (commit) {
              await this.qualityExplanation.generateExplanation(
                commit.sha,
                commit.message,
                metrics,
              );
            }
          }),
        );
      } catch (error) {
        this.logger.warn('Failed to generate AI explanations', error);
      }
    }

    const violations = this.antiGamingDetector.detectAntiPatterns(
      metricsResults,
      {
        trivialLinesThreshold:
          this.config.quality.antiGaming.trivialLinesThreshold,
        burstCommitCount: this.config.quality.antiGaming.rapidCommitThreshold,
        burstWindowMinutes: this.config.quality.antiGaming.rapidCommitWindow,
      },
    );

    await this.persistence.persistAnalysisResults(
      params.userId,
      params.owner,
      params.repo,
      metricsResults,
      violations,
      commits,
    );

    const temporal = await this.temporalAnalyzer.aggregateTemporalMetrics(
      params.userId,
      30,
    );

    const scores = metricsResults.map((m) => m.overallScore || 0);
    const average = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const worst = scores.length ? Math.min(...scores) : 0;

    return {
      userId: params.userId,
      repository: `${params.owner}/${params.repo}`,
      commitsAnalyzed: metricsResults.length,
      metricsResults,
      temporalMetrics: temporal,
      trends: [],
      violations,
      summary: {
        averageScore: Number(average.toFixed(2)),
        bestScore: best,
        worstScore: worst,
        flaggedCount: violations.length,
        improvementAreas: [],
      },
      analyzedAt: new Date(),
    };
  }
}
