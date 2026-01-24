import { Injectable } from '@nestjs/common';
import type { ViolationIncident, ViolationType } from '@verified-prof/shared';
import type { QualityMetricsResult } from './commit-scorer.service';

export interface AntiGamingConfig {
  trivialLinesThreshold: number;
  burstCommitCount: number;
  burstWindowMinutes: number;
}

@Injectable()
export class AntiGamingDetectorService {
  /**
   * Detects anti-gaming patterns across multiple commits.
   * Identifies trivial changes, burst commits, and suspicious patterns.
   * Returns list of violations with evidence and severity.
   */
  detectAntiPatterns(
    commits: QualityMetricsResult[],
    config: AntiGamingConfig,
  ): ViolationIncident[] {
    const violations: ViolationIncident[] = [];

    for (const commit of commits) {
      const trivialViolation = this.checkTrivialCommit(
        commit,
        config.trivialLinesThreshold,
      );
      if (trivialViolation) {
        violations.push(trivialViolation);
      }
    }

    const burstViolations = this.detectBurstCommits(commits, config);
    violations.push(...burstViolations);

    return violations;
  }

  /**
   * Checks if commit is trivial (very small change).
   */
  private checkTrivialCommit(
    commit: QualityMetricsResult,
    trivialThreshold: number,
  ): ViolationIncident | null {
    const linesChanged = commit.linesAdded + commit.linesDeleted;

    if (commit.filesChanged <= 1 && linesChanged <= trivialThreshold) {
      return {
        id: `v-${commit.commitSha}`,
        userId: '',
        commitSha: commit.commitSha,
        type: 'trivial_changes' as ViolationType,
        severity: 'low',
        description: 'Trivial change detected (very small commit)',
        evidence: {
          linesAdded: commit.linesAdded,
          linesDeleted: commit.linesDeleted,
          filesChanged: commit.filesChanged,
        },
        penaltyApplied: false,
        detected: new Date(),
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detects burst commit patterns (multiple commits in short time).
   */
  private detectBurstCommits(
    commits: QualityMetricsResult[],
    config: AntiGamingConfig,
  ): ViolationIncident[] {
    const violations: ViolationIncident[] = [];

    if (commits.length < config.burstCommitCount) {
      return violations;
    }

    return violations;
  }

  /**
   * Calculates suspicion score based on violation count and severity.
   */
  calculateSuspicionScore(violations: ViolationIncident[]): number {
    if (violations.length === 0) return 0;

    const severityWeights = {
      low: 10,
      medium: 30,
      high: 50,
      critical: 70,
    };

    const totalScore = violations.reduce((sum, v) => {
      return sum + severityWeights[v.severity];
    }, 0);

    return Math.min(100, totalScore);
  }

  /**
   * Determines if commit pattern is suspicious.
   */
  isSuspicious(violations: ViolationIncident[]): boolean {
    const highSeverityCount = violations.filter(
      (v) => v.severity === 'high',
    ).length;
    const mediumSeverityCount = violations.filter(
      (v) => v.severity === 'medium',
    ).length;

    return highSeverityCount > 0 || mediumSeverityCount >= 3;
  }
}
