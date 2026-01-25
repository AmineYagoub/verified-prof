import { Injectable, Logger } from '@nestjs/common';
import { InjectAppConfig, AppConfigType } from '@verified-prof/config';
import { VcsProviderFactory } from '../providers/vcs-provider.factory';
import { PLAN_POLICIES, ListCommitsOptions } from '@verified-prof/shared';
import {
  QualityAnalysisRequest,
  QualityAnalysisResponse,
  DomainConfig,
  CommitData,
} from '@verified-prof/shared';
import {
  CommitScorerService,
  QualityMetricsResult,
} from './services/commit-scorer.service';

// Local interface for quality weighting (hardcoded thresholds for Phase 1)
interface QualityWeightingProfile {
  userId: string;
  profileName: string;
  isActive: boolean;
  maxLinesPerCommit: number;
  maxFilesPerCommit: number;
  minLinesForReview: number;
  disciplineWeight: number;
  clarityWeight: number;
  impactWeight: number;
  consistencyWeight: number;
  primaryLanguages: string[];
  frameworkContext: string[];
}
import { AntiGamingDetectorService } from './services/anti-gaming-detector.service';
import { RepoAllocatorService } from './services/repo-allocator.service';
import { PersistenceService } from './services/persistence.service';
import { TemporalAnalyzerService } from './services/temporal-analyzer.service';
import { PrismaService } from '@verified-prof/prisma';
import {
  QualityMetricsResponse,
  TemporalMetricsResponse,
  AchievementQualityResponse,
  CommitMetricsResponse,
} from '@verified-prof/shared';

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
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyzes all repositories for a user according to plan policy.
   * Lists repositories, filters by activity window, allocates commits per repo.
   */
  async analyzeUserRepos(userId: string, plan: 'FREE' | 'PREMIUM' = 'FREE') {
    const policy = PLAN_POLICIES[plan];

    const provider = await this.providerFactory.createProviderForUser(userId);
    const repos = await provider.getUserRepositories(userId, {
      perPage: policy.repositoriesPerPage,
      page: 1,
    });

    // Enforce maxRepositories limit
    const reposToAnalyze = repos.slice(0, policy.maxRepositories);
    const since = new Date(
      Date.now() - policy.windowDays * 24 * 60 * 60 * 1000,
    );
    const results: Array<{
      repository: string;
      result: QualityAnalysisResponse | unknown;
    }> = [];

    const repoInfos = reposToAnalyze.map((repo) => ({
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

    for (const repo of reposToAnalyze) {
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

      try {
        const res = await this.analyzeRepository(params, {
          maxCommits: perRepoMax,
          plan,
        });

        // Skip if no commits were analyzed (empty repo)
        if (res.commitsAnalyzed === 0) {
          this.logger.warn(`Skipping empty repository: ${owner}/${repoName}`);
          continue;
        }

        results.push({ repository: `${owner}/${repoName}`, result: res });
      } catch (error) {
        this.logger.error(
          `Failed to analyze repository ${owner}/${repoName}`,
          error,
        );
        // Continue with next repository instead of failing entire analysis
        continue;
      }

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
    options?: { maxCommits?: number; plan?: 'FREE' | 'PREMIUM' },
  ): Promise<QualityAnalysisResponse> {
    const plan = options?.plan || 'FREE';
    const policy = PLAN_POLICIES[plan];

    const provider = await this.providerFactory.createProviderForUser(
      params.userId,
    );

    // fetch commits with pagination if maxCommits provided
    let commits: Array<CommitData> = [];
    if (options?.maxCommits && options.maxCommits > 0) {
      const perPage = Math.min(policy.commitsPerPage, options.maxCommits);
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
        perPage: policy.commitsPerPage,
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

  /**
   * Get user's current quality metrics
   */
  async getUserMetrics(userId: string): Promise<QualityMetricsResponse | null> {
    const temporal = await this.temporalAnalyzer.aggregateTemporalMetrics(
      userId,
      30,
    );

    const allMetrics = await this.prisma.$.commitQualityMetrics.findMany({
      where: { userId },
      orderBy: { analyzedAt: 'desc' },
      take: 100,
    });

    if (!allMetrics || allMetrics.length === 0) {
      return null;
    }

    const overallScore =
      allMetrics.reduce((sum, m) => sum + (m.overallScore || 0), 0) /
      allMetrics.length;
    const disciplineScore =
      allMetrics.reduce((sum, m) => sum + (m.disciplineScore || 0), 0) /
      allMetrics.length;
    const clarityScore =
      allMetrics.reduce((sum, m) => sum + (m.clarityScore || 0), 0) /
      allMetrics.length;
    const impactScore =
      allMetrics.reduce((sum, m) => sum + (m.impactScore || 0), 0) /
      allMetrics.length;
    const testingScore =
      allMetrics.reduce((sum, m) => sum + (m.testingScore || 0), 0) /
      allMetrics.length;
    const consistencyScore =
      allMetrics.reduce((sum, m) => sum + (m.consistencyScore || 0), 0) /
      allMetrics.length;

    return {
      userId,
      overallScore: Math.round(overallScore),
      disciplineScore: Math.round(disciplineScore),
      clarityScore: Math.round(clarityScore),
      testingScore: Math.round(testingScore),
      impactScore: Math.round(impactScore),
      consistencyScore: Math.round(consistencyScore),
      trend: temporal.trendDirection.toUpperCase() as
        | 'IMPROVING'
        | 'STABLE'
        | 'DECLINING',
      improvementVelocity: temporal.trendStrength,
      lastAnalyzedAt: allMetrics[0].analyzedAt,
      totalCommitsAnalyzed: allMetrics.length,
    };
  }

  /**
   * Get temporal quality metrics over time window
   */
  async getTemporalMetrics(
    userId: string,
    window: '30' | '60' | '90' = '90',
  ): Promise<TemporalMetricsResponse> {
    const windowDays = parseInt(window) as 30 | 60 | 90;
    const temporal = await this.temporalAnalyzer.aggregateTemporalMetrics(
      userId,
      windowDays,
    );

    const metrics = await this.prisma.$.commitQualityMetrics.findMany({
      where: {
        userId,
        analyzedAt: {
          gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { analyzedAt: 'asc' },
    });

    const dataPointsMap = new Map<string, { score: number; count: number }>();

    metrics.forEach((metric) => {
      const date = metric.analyzedAt.toISOString().split('T')[0];
      const existing = dataPointsMap.get(date) || { score: 0, count: 0 };
      dataPointsMap.set(date, {
        score: existing.score + (metric.overallScore || 0),
        count: existing.count + 1,
      });
    });

    const dataPoints = Array.from(dataPointsMap.entries()).map(
      ([date, data]) => ({
        date,
        score: Math.round(data.score / data.count),
        commitsCount: data.count,
      }),
    );

    const averageScore =
      dataPoints.reduce((sum, p) => sum + p.score, 0) / dataPoints.length || 0;

    return {
      userId,
      window,
      dataPoints,
      averageScore: Math.round(averageScore),
      trend: temporal.trendDirection.toUpperCase() as
        | 'IMPROVING'
        | 'STABLE'
        | 'DECLINING',
      improvementRate: temporal.trendStrength,
    };
  }

  /**
   * Get quality explanation for an achievement
   */
  async getAchievementExplanation(
    userId: string,
    achievementId: string,
  ): Promise<AchievementQualityResponse | null> {
    const achievement = await this.prisma.$.achievement.findFirst({
      where: {
        id: achievementId,
        userId,
      },
    });

    if (!achievement) {
      return null;
    }

    const providerData = achievement.providerData as {
      commitShas?: string[];
    } | null;
    const commitShas = providerData?.commitShas || [];

    const evidence = await this.prisma.$.commitQualityMetrics.findMany({
      where: {
        userId,
        commitSha: {
          in: commitShas,
        },
      },
      take: 10,
    });

    const avgScore =
      evidence.reduce((sum, e) => sum + (e.overallScore || 0), 0) /
        evidence.length || 0;

    return {
      achievementId,
      title: achievement.title,
      qualityScore: Math.round(avgScore * 100),
      explanation: achievement.description || 'Quality analysis in progress...',
      strengths: ['Clear implementation', 'Good test coverage'],
      improvements: ['Consider adding documentation'],
      metrics: {
        discipline:
          Math.round(
            (evidence.reduce((sum, e) => sum + (e.disciplineScore || 0), 0) /
              evidence.length) *
              100,
          ) || 0,
        clarity:
          Math.round(
            (evidence.reduce((sum, e) => sum + (e.clarityScore || 0), 0) /
              evidence.length) *
              100,
          ) || 0,
        testing: 75,
        impact:
          Math.round(
            (evidence.reduce((sum, e) => sum + (e.impactScore || 0), 0) /
              evidence.length) *
              100,
          ) || 0,
      },
      evidence: evidence.map((e) => ({
        commitSha: e.commitSha,
        message: e.messageScore?.toString() || 'Commit message',
        score: Math.round((e.overallScore || 0) * 100),
        url: `https://github.com/${userId}/${e.repositoryName}/commit/${e.commitSha}`,
      })),
    };
  }

  /**
   * Get detailed commit quality metrics
   */
  async getCommitMetrics(
    userId: string,
    commitSha: string,
  ): Promise<CommitMetricsResponse | null> {
    const metrics = await this.prisma.$.commitQualityMetrics.findFirst({
      where: {
        userId,
        commitSha,
      },
    });

    if (!metrics) {
      return null;
    }

    return {
      commitSha: metrics.commitSha,
      message: metrics.messageScore?.toString() || '',
      author: userId,
      date: metrics.analyzedAt,
      overallScore: Math.round((metrics.overallScore || 0) * 100),
      disciplineScore: Math.round((metrics.disciplineScore || 0) * 100),
      clarityScore: Math.round((metrics.clarityScore || 0) * 100),
      impactScore: Math.round((metrics.impactScore || 0) * 100),
      testingScore: Math.round((metrics.testingScore || 0) * 100),
      consistencyScore: Math.round((metrics.consistencyScore || 0) * 100),
      isDisciplined: metrics.isDisciplined || false,
      isClear: metrics.isClear || false,
      hasAntiPatterns: metrics.hasAntiPatterns || false,
      suspicionScore: Math.round((metrics.suspicionScore || 0) * 100),
      flagReasons: (metrics.flagReasons as string[]) || [],
      filesChanged: metrics.filesChanged || 0,
      linesAdded: metrics.linesAdded || 0,
      linesDeleted: metrics.linesDeleted || 0,
    };
  }
}
