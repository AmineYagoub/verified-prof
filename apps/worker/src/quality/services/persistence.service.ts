import { Injectable } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import type { CommitData, ViolationIncident } from '@verified-prof/shared';
import type { QualityMetricsResult } from './commit-scorer.service';

export interface PersistenceResult {
  jobId: string;
  snapshotId: string;
  commitMetricsCount: number;
  violationsCount: number;
  temporalMetricsId: string;
}

@Injectable()
export class PersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists analysis job, snapshot, commit metrics, and violations to database.
   * Handles all database operations for quality analysis results.
   */
  async persistAnalysisResults(
    userId: string,
    owner: string,
    repo: string,
    metricsResults: QualityMetricsResult[],
    violations: ViolationIncident[],
    commits: CommitData[],
  ): Promise<PersistenceResult> {
    const job = await this.createAnalysisJob(userId);
    const snapshot = await this.createAnalysisSnapshot(userId, job.id);

    for (let i = 0; i < metricsResults.length; i++) {
      const m = metricsResults[i];
      const orig = commits[i] as CommitData;

      const commitSignal = await this.createCommitSignal(
        snapshot.id,
        owner,
        repo,
        orig,
        m,
      );

      await this.createCommitQualityMetrics(
        userId,
        snapshot.id,
        commitSignal.id,
        owner,
        repo,
        m,
      );

      await this.createViolations(
        userId,
        commitSignal.id,
        violations.filter((v) => v.commitSha === m.commitSha),
      );
    }

    const temporalMetrics = await this.createTemporalMetrics(
      userId,
      snapshot.id,
      metricsResults,
      violations,
    );

    return {
      jobId: job.id,
      snapshotId: snapshot.id,
      commitMetricsCount: metricsResults.length,
      violationsCount: violations.length,
      temporalMetricsId: temporalMetrics.id,
    };
  }

  /**
   * Creates analysis job record.
   */
  private async createAnalysisJob(userId: string) {
    return await this.prisma.$.analysisJob.create({
      data: {
        userId,
        status: 'ANALYZING',
        provider: 'GITHUB',
      },
    });
  }

  /**
   * Creates analysis snapshot record.
   */
  private async createAnalysisSnapshot(userId: string, jobId: string) {
    return await this.prisma.$.analysisSnapshot.create({
      data: {
        userId,
        jobId,
        dataFingerprints: {},
        modelInfo: {},
        summary: {},
        status: 'PENDING',
      },
    });
  }

  /**
   * Creates commit signal record.
   */
  private async createCommitSignal(
    snapshotId: string,
    owner: string,
    repo: string,
    commit: CommitData,
    metrics: QualityMetricsResult,
  ) {
    return await this.prisma.$.commitSignal.create({
      data: {
        snapshotId,
        repo: `${owner}/${repo}`,
        occurredAt: commit.authorDate || commit.committerDate || new Date(),
        languages: [],
        filesChanged: metrics.filesChanged,
        linesAdded: metrics.linesAdded,
        linesDeleted: metrics.linesDeleted,
        type: 'FEATURE',
        weight: metrics.scopeScore,
        isSigned: (commit.verified as boolean) || false,
        isMerge: (commit.parentShas || []).length > 1,
        isTrivial: !metrics.isDisciplined,
        isGenerated: false,
      },
    });
  }

  /**
   * Creates commit quality metrics record.
   */
  private async createCommitQualityMetrics(
    userId: string,
    snapshotId: string,
    commitSignalId: string,
    owner: string,
    repo: string,
    metrics: QualityMetricsResult,
  ) {
    return await this.prisma.$.commitQualityMetrics.create({
      data: {
        commitSignalId,
        userId,
        snapshotId,
        overallScore: metrics.overallScore,
        disciplineScore: metrics.disciplineScore,
        clarityScore: metrics.clarityScore,
        impactScore: metrics.impactScore,
        consistencyScore: metrics.consistencyScore,
        scopeScore: metrics.scopeScore,
        messageScore: metrics.messageScore,
        reviewScore: metrics.reviewScore,
        testingScore: metrics.testingScore,
        documentationScore: metrics.documentationScore,
        isDisciplined: metrics.isDisciplined,
        isClear: metrics.isClear,
        isImpactful: metrics.isImpactful,
        isConsistent: metrics.isConsistent,
        hasAntiPatterns: metrics.hasAntiPatterns,
        commitSha: metrics.commitSha,
        repositoryName: `${owner}/${repo}`,
        detectedLanguages: metrics.detectedLanguages,
        filesChanged: metrics.filesChanged,
        linesAdded: metrics.linesAdded,
        linesDeleted: metrics.linesDeleted,
        analyzedAt: metrics.analyzedAt,
        suspicionScore: metrics.suspicionScore || 0,
        flagReasons: metrics.flagReasons || [],
      },
    });
  }

  /**
   * Creates violation records.
   */
  private async createViolations(
    userId: string,
    commitSignalId: string,
    violations: ViolationIncident[],
  ) {
    for (const v of violations) {
      await this.prisma.$.qualityViolation.create({
        data: {
          userId,
          commitSignalId,
          violationType: v.type,
          severity: v.severity,
          description: v.description,
          evidence: v.evidence as unknown as object,
          penaltyApplied: v.penaltyApplied,
        },
      });
    }
  }

  /**
   * Creates temporal metrics record.
   */
  private async createTemporalMetrics(
    userId: string,
    snapshotId: string,
    metricsResults: QualityMetricsResult[],
    violations: ViolationIncident[],
  ) {
    return await this.prisma.$.temporalMetrics.create({
      data: {
        userId,
        snapshotId,
        windowDays: 30,
        avgOverallScore: Number(
          (
            metricsResults.reduce((s, r) => s + (r.overallScore || 0), 0) /
            Math.max(1, metricsResults.length)
          ).toFixed(2),
        ),
        avgDiscipline: 0,
        avgClarity: 0,
        avgImpact: 0,
        avgConsistency: 0,
        totalCommits: metricsResults.length,
        disciplinedCommits: metricsResults.filter((m) => m.isDisciplined)
          .length,
        clearCommits: metricsResults.filter((m) => m.isClear).length,
        impactfulCommits: metricsResults.filter((m) => m.isImpactful).length,
        trendDirection: 'stable',
        trendStrength: 0,
        flaggedCommits: violations.length,
        suspicionRate: 0,
        windowStart: new Date(),
        windowEnd: new Date(),
      },
    });
  }
}
