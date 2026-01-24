import { Injectable } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import type { TemporalMetrics } from '@verified-prof/shared';

export interface TrendResult {
  direction: 'improving' | 'declining' | 'stable';
  strength: number;
  velocityChange: number;
  qualityChange: number;
}

export interface BurstDetectionResult {
  isBurst: boolean;
  commitCount: number;
  windowHours: number;
  suspicionLevel: 'none' | 'low' | 'medium' | 'high';
  evidence: {
    averageInterval: number;
    minInterval: number;
    maxInterval: number;
  };
}

export interface VelocityMetrics {
  commitsPerDay: number;
  linesPerDay: number;
  filesPerDay: number;
  avgCommitSize: number;
}

@Injectable()
export class TemporalAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyzes user trends over time.
   * Detects improving, declining, or stable patterns in quality metrics.
   */
  async analyzeUserTrends(
    userId: string,
    windowDays: number,
  ): Promise<TrendResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    const metrics = await this.prisma.$.commitQualityMetrics.findMany({
      where: {
        userId,
        analyzedAt: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        analyzedAt: 'asc',
      },
    });

    if (metrics.length < 2) {
      return {
        direction: 'stable',
        strength: 0,
        velocityChange: 0,
        qualityChange: 0,
      };
    }

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const avgFirst = this.calculateAverageScore(
      firstHalf.map((m) => m.overallScore),
    );
    const avgSecond = this.calculateAverageScore(
      secondHalf.map((m) => m.overallScore),
    );

    const qualityChange = avgSecond - avgFirst;
    const velocityChange = secondHalf.length - firstHalf.length;

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (qualityChange > 5) {
      direction = 'improving';
    } else if (qualityChange < -5) {
      direction = 'declining';
    }

    const strength = Math.abs(qualityChange) / 100;

    return {
      direction,
      strength,
      velocityChange,
      qualityChange,
    };
  }

  /**
   * Detects burst commit patterns (suspicious activity).
   * Identifies multiple commits in a short time window.
   */
  async detectBurst(
    userId: string,
    recentCommits: Array<{ analyzedAt: Date }>,
    thresholdCount = 10,
    windowHours = 4,
  ): Promise<BurstDetectionResult> {
    if (recentCommits.length < thresholdCount) {
      return {
        isBurst: false,
        commitCount: recentCommits.length,
        windowHours: 0,
        suspicionLevel: 'none',
        evidence: {
          averageInterval: 0,
          minInterval: 0,
          maxInterval: 0,
        },
      };
    }

    const sorted = recentCommits
      .map((c) => c.analyzedAt.getTime())
      .sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i] - sorted[i - 1]) / (1000 * 60));
    }

    const avgInterval =
      intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 0;
    const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0;
    const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0;

    const firstCommit = sorted[0];
    const lastCommit = sorted[sorted.length - 1];
    const actualWindow = (lastCommit - firstCommit) / (1000 * 60 * 60);

    const isBurst =
      sorted.length >= thresholdCount && actualWindow <= windowHours;

    let suspicionLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (isBurst) {
      if (avgInterval < 10) {
        suspicionLevel = 'high';
      } else if (avgInterval < 20) {
        suspicionLevel = 'medium';
      } else {
        suspicionLevel = 'low';
      }
    }

    return {
      isBurst,
      commitCount: sorted.length,
      windowHours: actualWindow,
      suspicionLevel,
      evidence: {
        averageInterval: avgInterval,
        minInterval,
        maxInterval,
      },
    };
  }

  /**
   * Calculates velocity metrics for a user.
   * Measures commits per day, lines per day, etc.
   */
  async calculateVelocityMetrics(
    userId: string,
    windowDays: number,
  ): Promise<VelocityMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    const metrics = await this.prisma.$.commitQualityMetrics.findMany({
      where: {
        userId,
        analyzedAt: {
          gte: cutoffDate,
        },
      },
    });

    if (metrics.length === 0) {
      return {
        commitsPerDay: 0,
        linesPerDay: 0,
        filesPerDay: 0,
        avgCommitSize: 0,
      };
    }

    const totalCommits = metrics.length;
    const totalLines = metrics.reduce(
      (sum, m) => sum + m.linesAdded + m.linesDeleted,
      0,
    );
    const totalFiles = metrics.reduce((sum, m) => sum + m.filesChanged, 0);

    return {
      commitsPerDay: totalCommits / windowDays,
      linesPerDay: totalLines / windowDays,
      filesPerDay: totalFiles / windowDays,
      avgCommitSize: totalLines / totalCommits,
    };
  }

  /**
   * Aggregates temporal metrics for a user over a window.
   * Replaces placeholder in QualityService.
   */
  async aggregateTemporalMetrics(
    userId: string,
    windowDays: 30 | 60 | 90,
  ): Promise<TemporalMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    const metrics = await this.prisma.$.commitQualityMetrics.findMany({
      where: {
        userId,
        analyzedAt: {
          gte: cutoffDate,
        },
      },
    });

    if (metrics.length === 0) {
      return this.createEmptyTemporalMetrics(userId, windowDays, cutoffDate);
    }

    const avgOverallScore = this.calculateAverageScore(
      metrics.map((m) => m.overallScore),
    );
    const avgDiscipline = this.calculateAverageScore(
      metrics.map((m) => m.disciplineScore),
    );
    const avgClarity = this.calculateAverageScore(
      metrics.map((m) => m.clarityScore),
    );
    const avgImpact = this.calculateAverageScore(
      metrics.map((m) => m.impactScore),
    );
    const avgConsistency = this.calculateAverageScore(
      metrics.map((m) => m.consistencyScore),
    );

    const totalCommits = metrics.length;
    const disciplinedCommits = metrics.filter((m) => m.isDisciplined).length;
    const clearCommits = metrics.filter((m) => m.isClear).length;
    const impactfulCommits = metrics.filter((m) => m.isImpactful).length;

    const trend = await this.analyzeUserTrends(userId, windowDays);

    const flaggedCommits = metrics.filter(
      (m) => m.flagReasons.length > 0,
    ).length;
    const suspicionRate = totalCommits > 0 ? flaggedCommits / totalCommits : 0;

    return {
      userId,
      windowDays,
      avgOverallScore,
      avgDiscipline,
      avgClarity,
      avgImpact,
      avgConsistency,
      totalCommits,
      disciplinedCommits,
      clearCommits,
      impactfulCommits,
      trendDirection: trend.direction,
      trendStrength: trend.strength,
      flaggedCommits,
      suspicionRate,
      windowStart: cutoffDate,
      windowEnd: new Date(),
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculates average score from array.
   */
  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Number((sum / scores.length).toFixed(2));
  }

  /**
   * Creates empty temporal metrics object.
   */
  private createEmptyTemporalMetrics(
    userId: string,
    windowDays: 30 | 60 | 90,
    cutoffDate: Date,
  ): TemporalMetrics {
    return {
      userId,
      windowDays,
      avgOverallScore: 0,
      avgDiscipline: 0,
      avgClarity: 0,
      avgImpact: 0,
      avgConsistency: 0,
      totalCommits: 0,
      disciplinedCommits: 0,
      clearCommits: 0,
      impactfulCommits: 0,
      trendDirection: 'stable',
      trendStrength: 0,
      flaggedCommits: 0,
      suspicionRate: 0,
      windowStart: cutoffDate,
      windowEnd: new Date(),
      calculatedAt: new Date(),
    };
  }
}
