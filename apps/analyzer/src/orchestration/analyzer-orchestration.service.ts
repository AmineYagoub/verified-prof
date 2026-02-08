import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { VcsProviderFactory } from '../providers/vcs-provider.factory';
import {
  AnalysisTriggeredEvent,
  JOB_EVENTS,
  JobStageProgressEvent,
  JobStage,
  JobStatus,
  MissionEvent,
  PLAN_POLICIES,
  PlanPolicy,
  TagSummaryEvent,
  VcsProviderType,
} from '@verified-prof/shared';
import { AstAnalyzerService } from './ast-analyzer.service';
import { PrismaService } from '@verified-prof/prisma';

@Injectable()
export class AnalyzerOrchestrationService {
  private readonly logger = new Logger(AnalyzerOrchestrationService.name);

  constructor(
    private readonly providerFactory: VcsProviderFactory,
    private readonly astAnalyzer: AstAnalyzerService,
    private readonly em: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_TRIGGERED, { async: true })
  async handleAnalysisTriggered(event: AnalysisTriggeredEvent) {
    try {
      const { userId, plan } = event;
      await this.deleteAllDataForUser(userId);
      const policy: PlanPolicy = PLAN_POLICIES[plan] ?? PLAN_POLICIES.FREE;
      const provider = await this.providerFactory.createProviderForUser(
        userId,
        VcsProviderType.GITHUB,
      );
      const repos = await provider.getLatestCommitsContent({
        maxRepo: policy.maxRepositories,
        maxCommits: policy.maxCommits,
        maxFilesPerCommit: policy.maxFilesPerCommit,
        commitsPerPage: policy.commitsPerPage,
        repositoriesPerPage: policy.repositoriesPerPage,
      });

      const missionEvents: MissionEvent[] = [];
      const totalCommits = repos.reduce(
        (acc, r) => acc + (r.commits?.length ?? 0),
        0,
      );
      let processedCommits = 0;
      for (const r of repos) {
        for (const c of r.commits) {
          const commitSummaries: TagSummaryEvent[] = [];
          for (const f of c.contents) {
            const tagSummary = await this.astAnalyzer.analyzeFile(
              f.filename,
              f.content,
            );
            commitSummaries.push({
              repo: f.repository,
              commitSha: c.sha,
              filePath: f.filename,
              userId,
              tagSummary,
              fileStats: {
                additions: f.additions,
                deletions: f.deletions,
                changes: f.changes,
              },
            });
          }

          const totalFiles = commitSummaries.length;
          const totalComplexity = commitSummaries.reduce(
            (acc, s) => acc + (s.tagSummary?.complexity ?? 0),
            0,
          );
          const [repoOwner, repoName] = r.repository.split('/');
          missionEvents.push(
            new MissionEvent(
              {
                commit_message: c.message,
                total_files: totalFiles,
                total_complexity: totalComplexity,
                repoOwner,
                repoName,
                commitAuthor: c.author,
                commitStats: c.stats,
                parentShas: c.parentShas,
                plan: event.plan,
              },
              commitSummaries,
            ),
          );
          processedCommits++;
          const commitProgress =
            10 + Math.round((processedCommits / totalCommits) * 20);
          this.em.emit(
            JOB_EVENTS.JOB_STAGE_PROGRESS,
            new JobStageProgressEvent(
              userId,
              JobStatus.RUNNING,
              JobStage.ANALYZING_COMMITS,
              commitProgress,
            ),
          );
        }
      }
      this.em.emit(JOB_EVENTS.ANALYSIS_TAG_SUMMARY, missionEvents);
    } catch (error) {
      this.logger.error(
        `Failed to handle analysis triggered event for user ${event.userId}`,
        error,
      );
      this.em.emit(
        JOB_EVENTS.JOB_STAGE_PROGRESS,
        new JobStageProgressEvent(
          event.userId,
          JobStatus.FAILED,
          JobStage.ANALYZING_COMMITS,
          0,
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  }

  private async deleteAllDataForUser(userId: string): Promise<void> {
    this.logger.log(`Deleting all analysis data for user ${userId}`);
    await Promise.all([
      this.prisma.client.analysisTagSummary.deleteMany({
        where: { userId },
      }),
      this.prisma.client.architecturalLayer.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.cognitivePattern.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.cognitiveStyle.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.coreMetrics.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.effortDistribution.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.languageExpertise.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.mentorshipActivity.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.mission.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.techStackDNA.deleteMany({
        where: { userProfile: { userId } },
      }),
      this.prisma.client.weeklyIntensity.deleteMany({
        where: { userProfile: { userId } },
      }),
    ]);

    this.logger.log(`All analysis data deleted for user ${userId}`);
  }
}
