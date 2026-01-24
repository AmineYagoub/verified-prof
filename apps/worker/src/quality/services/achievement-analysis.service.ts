import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import { VcsProviderFactory } from '../../providers/vcs-provider.factory';
import { AI_EVENTS } from '@verified-prof/shared';
import {
  AchievementExtractionRequestedEvent,
  AchievementExtractionCompletedEvent,
  AIRequestFailedEvent,
} from '../../ai/events/ai.events';

export interface AchievementAnalysisRequest {
  userId: string;
  owner: string;
  repo: string;
  since?: Date;
  maxPullRequests?: number;
}

export interface AchievementAnalysisResult {
  userId: string;
  repository: string;
  pullRequestsAnalyzed: number;
  achievementsExtracted: number;
  achievements: Array<{
    id: string;
    prNumber: number;
    title: string;
    description: string;
    impact: string;
    category: string;
    skills: string[];
    proofUrl: string;
    achievedAt: Date;
  }>;
  analyzedAt: Date;
}

@Injectable()
export class AchievementAnalysisService {
  private readonly logger = new Logger(AchievementAnalysisService.name);
  private pendingRequests = new Map<
    string,
    {
      userId: string;
      prNumber: number;
      owner: string;
      repo: string;
      startedAt: Date;
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(
    private readonly providerFactory: VcsProviderFactory,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyzes pull requests in a repository and extracts achievements.
   * Only processes merged PRs for valid achievements.
   */
  async analyzePullRequests(
    params: AchievementAnalysisRequest,
  ): Promise<AchievementAnalysisResult> {
    const provider = await this.providerFactory.createProviderForUser(
      params.userId,
    );

    const pullRequests = await provider.listPullRequests(
      params.owner,
      params.repo,
      {
        state: 'closed',
        perPage: params.maxPullRequests || 50,
      },
    );

    const mergedPRs = pullRequests.filter((pr) => pr.state === 'merged');

    this.logger.log(
      `Found ${mergedPRs.length} merged PRs in ${params.owner}/${params.repo}`,
    );

    const extractedAchievements: Array<{
      id: string;
      prNumber: number;
      title: string;
      description: string;
      impact: string;
      category: string;
      skills: string[];
      proofUrl: string;
      achievedAt: Date;
    }> = [];

    // Process each PR with event-driven AI
    const promises = mergedPRs.map(async (pr) => {
      try {
        if (params.since && pr.mergedAt && pr.mergedAt < params.since) {
          return;
        }

        const commits = await provider.getPullRequestCommits(
          params.owner,
          params.repo,
          pr.number,
        );

        // Emit AI request event and wait for response
        const achievement = await this.requestAchievementExtraction(
          params.userId,
          pr,
          commits,
          params.owner,
          params.repo,
        );

        if (achievement) {
          extractedAchievements.push(achievement);
          this.logger.log(
            `Extracted achievement from PR #${pr.number}: ${achievement.title}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to extract achievement from PR #${pr.number}`,
          error,
        );
      }
    });

    await Promise.all(promises);

    return {
      userId: params.userId,
      repository: `${params.owner}/${params.repo}`,
      pullRequestsAnalyzed: mergedPRs.length,
      achievementsExtracted: extractedAchievements.length,
      achievements: extractedAchievements,
      analyzedAt: new Date(),
    };
  }

  /**
   * Batch analyze multiple repositories for achievements.
   */
  async analyzeUserAchievements(
    userId: string,
    options?: { maxReposPerUser?: number; maxPRsPerRepo?: number },
  ): Promise<{
    repositoriesAnalyzed: number;
    totalAchievements: number;
    repositories: AchievementAnalysisResult[];
  }> {
    const provider = await this.providerFactory.createProviderForUser(userId);
    const repos = await provider.getUserRepositories(userId, {
      perPage: options?.maxReposPerUser || 10,
    });

    const results: AchievementAnalysisResult[] = [];
    let totalAchievements = 0;

    for (const repo of repos) {
      try {
        const result = await this.analyzePullRequests({
          userId,
          owner: repo.ownerUsername || repo.fullName.split('/')[0],
          repo: repo.name,
          maxPullRequests: options?.maxPRsPerRepo || 20,
        });

        results.push(result);
        totalAchievements += result.achievementsExtracted;

        this.logger.log(
          `Completed analysis for ${repo.fullName}: ${result.achievementsExtracted} achievements`,
        );
      } catch (error) {
        this.logger.error(`Failed to analyze ${repo.fullName}`, error);
      }
    }

    return {
      repositoriesAnalyzed: results.length,
      totalAchievements,
      repositories: results,
    };
  }

  /**
   * Request achievement extraction via AI service (event-driven)
   */
  private async requestAchievementExtraction(
    userId: string,
    pr: any,
    commits: any[],
    owner: string,
    repo: string,
  ): Promise<{
    id: string;
    prNumber: number;
    title: string;
    description: string;
    impact: string;
    category: string;
    skills: string[];
    proofUrl: string;
    achievedAt: Date;
  } | null> {
    const requestId = `ach_${userId}_${pr.number}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Store request context
      this.pendingRequests.set(requestId, {
        userId,
        prNumber: pr.number,
        owner,
        repo,
        startedAt: new Date(),
        resolve,
        reject,
      });

      // Set timeout (30 seconds)
      setTimeout(() => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          this.pendingRequests.delete(requestId);
          reject(new Error('AI extraction timeout'));
        }
      }, 30000);

      // Emit AI request event
      this.eventEmitter.emit(
        AI_EVENTS.ACHIEVEMENT_EXTRACTION_REQUESTED,
        new AchievementExtractionRequestedEvent(
          requestId,
          userId,
          pr.number,
          pr.title,
          pr.body || '',
          {
            linesAdded: pr.additions,
            linesDeleted: pr.deletions,
            filesChanged: pr.changed_files || 0,
            commitsCount: commits.length,
            reviewComments: pr.comments || 0,
          },
        ),
      );

      this.logger.debug(`Emitted AI extraction request for PR #${pr.number}`);
    });
  }

  /**
   * Handle AI achievement extraction completion
   */
  @OnEvent(AI_EVENTS.ACHIEVEMENT_EXTRACTION_COMPLETED)
  async handleAchievementExtracted(
    event: AchievementExtractionCompletedEvent,
  ): Promise<void> {
    const pending = this.pendingRequests.get(event.requestId);
    if (!pending) {
      return;
    }

    try {
      if (!event.achievements || event.achievements.length === 0) {
        pending.resolve(null);
        this.pendingRequests.delete(event.requestId);
        return;
      }

      const achievement = event.achievements[0];

      // Persist to database
      const persisted = await this.persistAchievement(pending.userId, {
        title: achievement.title,
        description: achievement.description,
        impact: achievement.impact,
        category: achievement.category,
        skills: achievement.skills,
        proofUrl:
          achievement.proof?.url || `https://github.com/pr/${pending.prNumber}`,
        achievedAt: new Date(),
        repositoryName: `${pending.owner}/${pending.repo}`,
      });

      pending.resolve({
        id: persisted.id,
        prNumber: pending.prNumber,
        title: achievement.title,
        description: achievement.description,
        impact: achievement.impact,
        category: achievement.category,
        skills: achievement.skills,
        proofUrl:
          achievement.proof?.url || `https://github.com/pr/${pending.prNumber}`,
        achievedAt: new Date(),
      });
    } catch (error) {
      pending.reject(error as Error);
    } finally {
      this.pendingRequests.delete(event.requestId);
    }
  }

  /**
   * Handle AI request failures
   */
  @OnEvent(AI_EVENTS.REQUEST_FAILED)
  async handleAIFailure(event: AIRequestFailedEvent): Promise<void> {
    if (!event.requestId.startsWith('ach_')) return;

    const pending = this.pendingRequests.get(event.requestId);
    if (!pending) return;

    this.logger.error(
      `AI extraction failed for PR ${pending.prNumber}: ${event.error}`,
    );

    pending.reject(new Error(event.error));
    this.pendingRequests.delete(event.requestId);
  }

  /**
   * Persists achievement to database.
   */
  private async persistAchievement(
    userId: string,
    achievement: {
      title: string;
      description: string;
      impact: string;
      category: string;
      skills: string[];
      proofUrl: string;
      achievedAt: Date;
      repositoryName: string;
    },
  ) {
    const impactMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
    };

    const categoryMap: Record<string, string> = {
      feature: 'FEATURE',
      bugfix: 'BUGFIX',
      performance: 'PERFORMANCE',
      security: 'SECURITY',
      refactor: 'REFACTOR',
      infrastructure: 'DEVOPS',
      documentation: 'DOCUMENTATION',
      testing: 'TESTING',
      architecture: 'ARCHITECTURE',
    };

    return await this.prisma.client.achievement.create({
      data: {
        userId,
        title: achievement.title,
        description: achievement.description,
        impact: impactMap[achievement.impact.toLowerCase()] || 'MEDIUM',
        category:
          (categoryMap[achievement.category.toLowerCase()] as
            | 'FEATURE'
            | 'BUGFIX'
            | 'PERFORMANCE'
            | 'SECURITY'
            | 'REFACTOR'
            | 'DOCUMENTATION'
            | 'TESTING'
            | 'DEVOPS'
            | 'ARCHITECTURE') || 'FEATURE',
        skills: achievement.skills.join(', '),
        proofUrl: achievement.proofUrl,
        proofType: 'PULL_REQUEST',
        achievedAt: achievement.achievedAt,
        confidence: 0.85,
      },
    });
  }
}
