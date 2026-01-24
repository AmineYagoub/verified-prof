import { Injectable } from '@nestjs/common';
import type { CommitData, DomainConfig } from '@verified-prof/shared';

export interface DisciplineResult {
  score: number;
  isDisciplined: boolean;
  violations: string[];
  metrics: {
    linesChanged: number;
    filesChanged: number;
    ratio: number;
  };
}

@Injectable()
export class DisciplineCalculatorService {
  /**
   * Analyzes commit discipline based on scope and size.
   * Evaluates if commit is focused (not too large, not too small).
   * Returns discipline score (0-100) and detected violations.
   */
  calculateDiscipline(
    commit: CommitData,
    config: DomainConfig,
    trivialThreshold: number,
  ): DisciplineResult {
    const additions = commit.additions || 0;
    const deletions = commit.deletions || 0;
    const linesChanged = additions + deletions;
    const filesChanged = commit.filesChanged || 0;

    const violations: string[] = [];

    if (linesChanged === 0) {
      violations.push('empty_commit');
    }

    if (linesChanged > config.maxLinesPerCommit) {
      violations.push('too_large');
    }

    if (linesChanged < trivialThreshold && filesChanged <= 1) {
      violations.push('too_small');
    }

    if (filesChanged > config.maxFilesPerCommit) {
      violations.push('too_many_files');
    }

    const ratio = Math.max(
      0,
      1 - linesChanged / Math.max(1, config.maxLinesPerCommit),
    );
    const score = Math.round(ratio * 100);

    return {
      score,
      isDisciplined: score >= 60 && violations.length === 0,
      violations,
      metrics: {
        linesChanged,
        filesChanged,
        ratio,
      },
    };
  }

  /**
   * Calculates scope score based on commit size.
   * Smaller, focused commits score higher.
   */
  calculateScopeScore(linesChanged: number, config: DomainConfig): number {
    return Math.max(
      0,
      100 -
        Math.min(
          100,
          (linesChanged / Math.max(1, config.maxLinesPerCommit)) * 100,
        ),
    );
  }

  /**
   * Determines if commit is trivial based on thresholds.
   */
  isTrivial(commit: CommitData, trivialThreshold: number): boolean {
    const linesChanged = (commit.additions || 0) + (commit.deletions || 0);
    return commit.filesChanged <= 1 && linesChanged <= trivialThreshold;
  }

  /**
   * Determines if commit is too large (merge, mass change).
   */
  isPerfectOrTooLarge(linesChanged: number, config: DomainConfig): boolean {
    return linesChanged > config.maxLinesPerCommit * 2;
  }
}
