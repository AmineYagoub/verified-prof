import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  AnalysisPersistedEvent,
  CodeOwnershipDto,
  CommitMetadataDto,
  JOB_EVENTS,
  JobProgressEvent,
  MissionEvent,
  PullRequestReviewDto,
  VcsProviderType,
} from '@verified-prof/shared';
import { createHash } from 'crypto';
import { GitHubCollaborationService } from '../providers/github/github-collaboration.service';
import { VcsProviderFactory } from '../providers/vcs-provider.factory';

@Injectable()
export class PersistsService {
  private readonly logger = new Logger(PersistsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly em: EventEmitter2,
    private readonly providerFactory: VcsProviderFactory,
    private readonly collaborationService: GitHubCollaborationService,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_TAG_SUMMARY, { async: true })
  async handleTagSummary(missionEvents: MissionEvent[]) {
    const allSummaries = missionEvents.flatMap((m) => m.summaries);
    const commitShas: string[] = [];
    const persistedSummaries: Array<{
      id: string;
      repoFullName: string;
      commitSha: string;
      filePath: string;
      tagSummary: unknown;
      createdAt: Date;
    }> = [];
    let totalFiles = 0;
    let totalComplexity = 0;
    let userId: string | null = null;

    if (allSummaries.length > 0) {
      userId = allSummaries[0].userId;
      const uniqueCommitShas = new Set<string>();
      for (const summary of allSummaries) {
        uniqueCommitShas.add(summary.commitSha);
        totalFiles++;
        totalComplexity += summary.tagSummary.complexity || 0;
      }
      commitShas.push(...uniqueCommitShas);
      try {
        await this.prisma.client.analysisTagSummary.createMany({
          data: allSummaries.map((summary) => ({
            repoFullName: summary.repo,
            commitSha: summary.commitSha,
            filePath: summary.filePath,
            contentHash: summary.tagSummary.contentHash,
            tagSummary: JSON.parse(JSON.stringify(summary.tagSummary)),
            userId: summary.userId || null,
          })),
          skipDuplicates: true,
        });
        const persisted = await this.prisma.client.analysisTagSummary.findMany({
          where: {
            OR: allSummaries.map((summary) => ({
              repoFullName: summary.repo,
              commitSha: summary.commitSha,
              filePath: summary.filePath,
            })),
          },
          select: {
            id: true,
            repoFullName: true,
            commitSha: true,
            filePath: true,
            tagSummary: true,
            createdAt: true,
          },
        });
        persistedSummaries.push(...persisted);
      } catch (error) {
        this.logger.error(
          `Failed to persist ${allSummaries.length} summaries`,
          error,
        );
      }
    }
    const weekStart = this.getISOWeek(new Date());
    const repoMetadata = this.extractRepoMetadata(missionEvents);
    let collaborationData: Partial<AnalysisPersistedEvent> = {};
    if (userId && repoMetadata.length > 0) {
      try {
        collaborationData = await this.extractCollaborationMetrics(
          userId,
          repoMetadata,
          missionEvents,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to extract collaboration metrics: ${(error as Error).message}`,
        );
      }
    }
    this.em.emit(JOB_EVENTS.ANALYSIS_PERSISTED, {
      userId,
      commitShas,
      totalFiles,
      totalComplexity,
      weekStart,
      tagSummaries: persistedSummaries,
      ...collaborationData,
    });
  }

  private getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  private anonymizeEmail(email: string): string {
    return createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex')
      .substring(0, 16);
  }

  @OnEvent(JOB_EVENTS.JOB_PROGRESS, { async: true })
  async handleJobProgress(event: JobProgressEvent) {
    this.logger.debug('Handling job progress event:', event);
  }

  private extractRepoMetadata(
    missionEvents: MissionEvent[],
  ): Array<{ owner: string; name: string }> {
    const repos = new Map<string, { owner: string; name: string }>();
    for (const mission of missionEvents) {
      const { repoOwner, repoName } = mission.mission_metadata;
      if (repoOwner && repoName) {
        const key = `${repoOwner}/${repoName}`;
        repos.set(key, { owner: repoOwner, name: repoName });
      }
    }
    return Array.from(repos.values());
  }

  private async extractCollaborationMetrics(
    userId: string,
    repos: Array<{ owner: string; name: string }>,
    missionEvents: MissionEvent[],
  ): Promise<Partial<AnalysisPersistedEvent>> {
    try {
      const provider = await this.providerFactory.createProviderForUser(
        userId,
        VcsProviderType.GITHUB,
      );
      const allMetrics = {
        commitMetadata: [] as CommitMetadataDto[],
        codeOwnership: [] as CodeOwnershipDto[],
        pullRequestReviews: [] as PullRequestReviewDto[],
        teamSize: 1,
      };

      const existingCommitMetadata = new Map<string, CommitMetadataDto>();
      for (const mission of missionEvents) {
        if (mission.mission_metadata.commitAuthor) {
          const commitSha = mission.summaries[0]?.commitSha;
          if (commitSha) {
            existingCommitMetadata.set(commitSha, {
              sha: commitSha,
              message: mission.mission_metadata.commit_message,
              authorDate: mission.mission_metadata.commitAuthor.date,
              authorId: this.anonymizeEmail(
                mission.mission_metadata.commitAuthor.email,
              ),
              additions: mission.mission_metadata.commitStats?.additions || 0,
              deletions: mission.mission_metadata.commitStats?.deletions || 0,
              filesChanged: mission.mission_metadata.total_files,
              parentShas: mission.mission_metadata.parentShas || [],
            });
          }
        }
      }

      for (const repo of repos) {
        try {
          const metrics =
            await this.collaborationService.extractCollaborationMetrics(
              provider,
              repo.owner,
              repo.name,
              missionEvents.map((m) => ({
                commitAuthor: m.mission_metadata.commitAuthor,
                summaries: m.summaries.map((s) => ({
                  filePath: s.filePath,
                  fileStats: s.fileStats,
                })),
              })),
            );

          allMetrics.codeOwnership.push(
            ...Array.from(metrics.codeOwnership.values()).map((o) => ({
              filePath: o.filePath,
              totalCommits: o.totalCommits,
              authorCommits: o.authorCommits,
              ownershipPercentage: o.ownershipPercentage,
            })),
          );

          allMetrics.pullRequestReviews.push(
            ...metrics.pullRequestReviews.map((r) => ({
              commitSha: r.commitSha,
              prNumber: r.prNumber,
              reviewedAt: r.reviewedAt.toISOString(),
              commentsCount: r.commentsCount,
            })),
          );
          allMetrics.teamSize = Math.max(allMetrics.teamSize, metrics.teamSize);
        } catch (error) {
          this.logger.warn(
            `Failed to extract metrics for ${repo.owner}/${repo.name}: ${(error as Error).message}`,
          );
        }
      }
      allMetrics.commitMetadata = Array.from(existingCommitMetadata.values());
      return allMetrics;
    } catch (error) {
      this.logger.error(
        `Collaboration extraction failed: ${(error as Error).message}`,
      );
      return {};
    }
  }
}
