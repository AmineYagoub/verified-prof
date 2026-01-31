import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { VcsProviderFactory } from '../providers/vcs-provider.factory';
import {
  AnalysisTriggeredEvent,
  JOB_EVENTS,
  JobProgressEvent,
  MissionEvent,
  PLAN_POLICIES,
  PlanPolicy,
  TagSummaryEvent,
} from '@verified-prof/shared';
import { AstAnalyzerService } from './ast-analyzer.service';

@Injectable()
export class AnalyzerOrchestrationService {
  private readonly logger = new Logger(AnalyzerOrchestrationService.name);

  constructor(
    private readonly providerFactory: VcsProviderFactory,
    private readonly astAnalyzer: AstAnalyzerService,
    private readonly em: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_TRIGGERED, { async: true })
  async handleAnalysisTriggered(event: AnalysisTriggeredEvent) {
    try {
      const { userId, plan } = event;
      const policy: PlanPolicy = PLAN_POLICIES[plan] ?? PLAN_POLICIES.FREE;
      const provider = await this.providerFactory.createProviderForUser(userId);
      const repos = await provider.getLatestCommitsContent({
        maxRepo: policy.maxRepositories,
        maxCommits: policy.maxCommits,
        maxFilesPerCommit: policy.maxFilesPerCommit,
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
              tagSummary,
            });
          }

          const totalFiles = commitSummaries.length;
          const totalComplexity = commitSummaries.reduce(
            (acc, s) => acc + (s.tagSummary?.complexity ?? 0),
            0,
          );
          const commitMessage = c.contents?.[0]?.message ?? '';
          missionEvents.push(
            new MissionEvent(
              {
                commit_message: commitMessage,
                total_files: totalFiles,
                total_complexity: totalComplexity,
              },
              commitSummaries,
            ),
          );
          processedCommits++;
          const progress = this.calculateProgress(
            processedCommits,
            totalCommits,
          );
          const ev = new JobProgressEvent(
            userId,
            progress,
            processedCommits,
            totalCommits,
          );
          this.logger.debug(
            `Emitting job progress: ${JSON.stringify(ev, null, 2)}`,
          );
          this.em.emit(JOB_EVENTS.JOB_PROGRESS, ev);
        }
      }

      this.em.emit(JOB_EVENTS.ANALYSIS_TAG_SUMMARY, missionEvents);
    } catch (error) {
      this.logger.error(
        `Failed to handle analysis triggered event for user ${event.userId}`,
        error,
      );
    }
  }

  /**
   * Calculate a progress percentage based on processed and total item counts.
   *
   *
   * @param processed - Number of items that have been processed.
   * @param total - Total number of items to process.
   * @returns An integer percentage (rounded) representing progress, bounded above by 100.
   */
  private calculateProgress(processed: number, total: number): number {
    if (total <= 0) return 100;
    return Math.min(100, Math.round((processed / total) * 100));
  }
}
