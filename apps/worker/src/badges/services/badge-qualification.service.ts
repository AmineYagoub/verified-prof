import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService, BadgeType } from '@verified-prof/prisma';
import { AI_EVENTS } from '@verified-prof/shared';
import {
  BadgeDescriptionRequestedEvent,
  BadgeDescriptionCompletedEvent,
} from '../../ai/events/ai.events';
import {
  BADGE_CRITERIA,
  BadgeCriteria,
  BadgeMetric,
  getAllBadgeTypes,
} from '../definitions/badge-criteria';

export interface BadgeEvaluation {
  type: BadgeType;
  qualified: boolean;
  confidence: number;
  progress: Record<string, { current: number; required: number; met: boolean }>;
  missingRequirements: string[];
}

export interface BadgeQualificationResult {
  userId: string;
  evaluations: BadgeEvaluation[];
  qualifiedBadges: BadgeType[];
  newBadgesEarned: number;
  totalBadges: number;
}

interface UserMetrics {
  totalCommits: number;
  commitsLast90Days: number;
  commitsLast30Days: number;
  prReviews: number;
  mergedPRs: number;
  consecutiveDays: number;
  avgQualityScore: number;
  ossContributions: number;
  achievementCounts: Record<string, number>;
}

@Injectable()
export class BadgeQualificationService {
  private readonly logger = new Logger(BadgeQualificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async evaluateUserBadges(userId: string): Promise<BadgeQualificationResult> {
    this.logger.log(`Evaluating badges for user ${userId}`);

    const metrics = await this.gatherUserMetrics(userId);
    const existingBadges = await this.getExistingBadges(userId);
    const existingBadgeTypes = new Set(existingBadges.map((b) => b.type));

    const evaluations: BadgeEvaluation[] = [];
    const qualifiedBadges: BadgeType[] = [];

    for (const badgeType of getAllBadgeTypes()) {
      const criteria = BADGE_CRITERIA[badgeType];
      const evaluation = this.evaluateBadge(criteria, metrics);
      evaluations.push(evaluation);

      if (evaluation.qualified && !existingBadgeTypes.has(badgeType)) {
        qualifiedBadges.push(badgeType);
      }
    }

    let newBadgesEarned = 0;
    for (const badgeType of qualifiedBadges) {
      const created = await this.awardBadge(userId, badgeType, metrics);
      if (created) {
        newBadgesEarned++;
      }
    }

    return {
      userId,
      evaluations,
      qualifiedBadges,
      newBadgesEarned,
      totalBadges: existingBadges.length + newBadgesEarned,
    };
  }

  private evaluateBadge(
    criteria: BadgeCriteria,
    metrics: UserMetrics,
  ): BadgeEvaluation {
    const progress: Record<
      string,
      { current: number; required: number; met: boolean }
    > = {};
    const missingRequirements: string[] = [];
    let allMet = true;

    for (const req of criteria.requirements) {
      const current = this.getMetricValue(
        req.metric,
        metrics,
        req.timeWindowDays,
      );
      const met = current >= req.threshold;

      progress[req.metric] = {
        current,
        required: req.threshold,
        met,
      };

      if (!met) {
        allMet = false;
        missingRequirements.push(req.description);
      }
    }

    const progressRatio = this.calculateProgressRatio(progress);
    const confidence = allMet
      ? criteria.minimumConfidence
      : progressRatio * 0.5;

    return {
      type: criteria.type,
      qualified: allMet,
      confidence,
      progress,
      missingRequirements,
    };
  }

  private getMetricValue(
    metric: BadgeMetric,
    metrics: UserMetrics,
    timeWindowDays?: number,
  ): number {
    switch (metric) {
      case 'total_commits':
        return metrics.totalCommits;

      case 'commits_in_window':
        if (timeWindowDays === 90) return metrics.commitsLast90Days;
        if (timeWindowDays === 30) return metrics.commitsLast30Days;
        return metrics.totalCommits;

      case 'pr_reviews':
        return metrics.prReviews;

      case 'merged_prs':
        return metrics.mergedPRs;

      case 'security_achievements':
        return metrics.achievementCounts['SECURITY'] || 0;

      case 'performance_achievements':
        return metrics.achievementCounts['PERFORMANCE'] || 0;

      case 'testing_achievements':
        return metrics.achievementCounts['TESTING'] || 0;

      case 'documentation_achievements':
        return metrics.achievementCounts['DOCUMENTATION'] || 0;

      case 'auth_achievements':
        return metrics.achievementCounts['AUTH'] || 0;

      case 'avg_quality_score':
        return metrics.avgQualityScore;

      case 'consecutive_days':
        return metrics.consecutiveDays;

      case 'oss_contributions':
        return metrics.ossContributions;

      default:
        return 0;
    }
  }

  private calculateProgressRatio(
    progress: Record<
      string,
      { current: number; required: number; met: boolean }
    >,
  ): number {
    const entries = Object.values(progress);
    if (entries.length === 0) return 0;

    const ratios = entries.map((p) => Math.min(1, p.current / p.required));
    return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  }

  private async gatherUserMetrics(userId: string): Promise<UserMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalCommits,
      commitsLast90Days,
      commitsLast30Days,
      qualityMetrics,
      achievements,
    ] = await Promise.all([
      this.prisma.client.commitSignal.count({
        where: { snapshot: { userId } },
      }),
      this.prisma.client.commitSignal.count({
        where: {
          snapshot: { userId },
          occurredAt: { gte: ninetyDaysAgo },
        },
      }),
      this.prisma.client.commitSignal.count({
        where: {
          snapshot: { userId },
          occurredAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.client.commitQualityMetrics.aggregate({
        where: { userId },
        _avg: { overallScore: true },
      }),
      this.prisma.client.achievement.groupBy({
        by: ['category'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    const achievementCounts: Record<string, number> = {};
    for (const a of achievements) {
      achievementCounts[a.category] = a._count.id;
    }

    const consecutiveDays = await this.calculateConsecutiveDays(userId);

    return {
      totalCommits,
      commitsLast90Days,
      commitsLast30Days,
      prReviews: 0,
      mergedPRs: 0,
      consecutiveDays,
      avgQualityScore: qualityMetrics._avg.overallScore || 0,
      ossContributions: 0,
      achievementCounts,
    };
  }

  private async calculateConsecutiveDays(userId: string): Promise<number> {
    const commits = await this.prisma.client.commitSignal.findMany({
      where: { snapshot: { userId } },
      select: { occurredAt: true },
      orderBy: { occurredAt: 'desc' },
    });

    if (commits.length === 0) return 0;

    const uniqueDays = new Set<string>();
    for (const commit of commits) {
      const dateStr = commit.occurredAt.toISOString().split('T')[0];
      uniqueDays.add(dateStr);
    }

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    let streak = 1;
    const today = new Date().toISOString().split('T')[0];

    if (sortedDays[0] !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (sortedDays[0] !== yesterday) {
        return 0;
      }
    }

    for (let i = 1; i < sortedDays.length; i++) {
      const current = new Date(sortedDays[i - 1]);
      const prev = new Date(sortedDays[i]);
      const diffDays = Math.floor(
        (current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async getExistingBadges(userId: string) {
    return this.prisma.client.badge.findMany({
      where: { userId },
      select: { type: true },
    });
  }

  private async awardBadge(
    userId: string,
    type: BadgeType,
    metrics: UserMetrics,
  ): Promise<boolean> {
    try {
      const criteria = BADGE_CRITERIA[type];

      const evidence = JSON.stringify({
        metrics: {
          totalCommits: metrics.totalCommits,
          commitsLast90Days: metrics.commitsLast90Days,
          avgQualityScore: metrics.avgQualityScore,
          consecutiveDays: metrics.consecutiveDays,
          achievementCounts: metrics.achievementCounts,
        },
        evaluatedAt: new Date().toISOString(),
      });

      // Create badge with placeholder description
      const badge = await this.prisma.client.badge.create({
        data: {
          userId,
          type,
          name: criteria.name,
          description: criteria.description, // Will be updated by AI
          earnedAt: new Date(),
          criteria: JSON.stringify(criteria.requirements),
          evidence,
          confidence: criteria.minimumConfidence,
          verificationStatus: 'VERIFIED',
        },
      });

      // Request AI description (fire-and-forget)
      this.requestBadgeDescription(badge.id, type, metrics);

      this.logger.log(`Awarded badge ${type} to user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to award badge ${type}`, error);
      return false;
    }
  }

  /**
   * Request AI-generated badge description
   */
  private requestBadgeDescription(
    badgeId: string,
    type: BadgeType,
    metrics: UserMetrics,
  ): void {
    const requestId = `badge_${badgeId}_${Date.now()}`;

    this.eventEmitter.emit(
      AI_EVENTS.BADGE_DESCRIPTION_REQUESTED,
      new BadgeDescriptionRequestedEvent(
        requestId,
        metrics.totalCommits.toString(), // userId will be fetched from badge
        type,
        badgeId,
        {
          commits: metrics.totalCommits,
          qualityScore: metrics.avgQualityScore,
          streak: metrics.consecutiveDays,
          achievements: Object.values(metrics.achievementCounts).reduce(
            (sum: number, count) => sum + (count as number),
            0,
          ),
        },
      ),
    );

    this.logger.debug(`Requested AI description for badge ${badgeId}`);
  }

  /**
   * Handle AI-generated description completion
   */
  @OnEvent(AI_EVENTS.BADGE_DESCRIPTION_COMPLETED)
  async handleBadgeDescriptionCompleted(
    event: BadgeDescriptionCompletedEvent,
  ): Promise<void> {
    try {
      await this.prisma.client.badge.update({
        where: { id: event.badgeId },
        data: {
          description: event.description,
        },
      });

      this.logger.log(
        `Updated AI-generated description for badge ${event.badgeId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update badge description: ${error}`, error);
    }
  }
}
