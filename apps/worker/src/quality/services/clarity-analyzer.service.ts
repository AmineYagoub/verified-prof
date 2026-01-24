import { Injectable } from '@nestjs/common';
import type { CommitData } from '@verified-prof/shared';

export interface ClarityResult {
  score: number;
  isClear: boolean;
  violations: string[];
  metrics: {
    messageLength: number;
    hasConventionalFormat: boolean;
    hasVerb: boolean;
    hasScope: boolean;
  };
}

@Injectable()
export class ClarityAnalyzerService {
  private readonly CONVENTIONAL_COMMIT_PATTERN =
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:.+/;
  private readonly ACTION_VERBS = [
    'add',
    'fix',
    'update',
    'remove',
    'refactor',
    'implement',
    'create',
    'delete',
    'improve',
    'optimize',
    'enhance',
    'resolve',
  ];

  /**
   * Analyzes commit message clarity based on conventions and content.
   * Evaluates conventional commit format, action verbs, and message quality.
   * Returns clarity score (0-100) and detected violations.
   */
  analyzeClarity(commit: CommitData): ClarityResult {
    const message = commit.message || '';
    const messageLength = message.length;
    const violations: string[] = [];

    if (messageLength === 0) {
      violations.push('empty_message');
    }

    if (messageLength < 10) {
      violations.push('too_short');
    }

    if (messageLength > 500) {
      violations.push('too_long');
    }

    const hasConventionalFormat =
      this.CONVENTIONAL_COMMIT_PATTERN.test(message);
    if (!hasConventionalFormat && messageLength > 0) {
      violations.push('non_conventional');
    }

    const hasVerb = this.hasActionVerb(message);
    if (!hasVerb && messageLength > 0) {
      violations.push('no_action_verb');
    }

    const hasScope = this.hasScope(message);

    const score = this.calculateClarityScore(
      messageLength,
      hasConventionalFormat,
      hasVerb,
      hasScope,
    );

    return {
      score,
      isClear: score >= 60 && violations.length <= 1,
      violations,
      metrics: {
        messageLength,
        hasConventionalFormat,
        hasVerb,
        hasScope,
      },
    };
  }

  /**
   * Calculates message score based on length and conventions.
   */
  calculateMessageScore(messageLength: number): number {
    const baseScore = Math.min(100, Math.round((messageLength / 200) * 100));
    return Math.max(0, baseScore);
  }

  /**
   * Checks if message contains an action verb.
   */
  private hasActionVerb(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.ACTION_VERBS.some((verb) => lowerMessage.includes(verb));
  }

  /**
   * Checks if message has a scope in conventional format.
   */
  private hasScope(message: string): boolean {
    const match = message.match(/^[a-z]+\((.+)\):/);
    return match !== null && match[1].length > 0;
  }

  /**
   * Calculates comprehensive clarity score.
   */
  private calculateClarityScore(
    messageLength: number,
    hasConventionalFormat: boolean,
    hasVerb: boolean,
    hasScope: boolean,
  ): number {
    let score = 0;

    score += Math.min(50, Math.round((messageLength / 100) * 50));

    if (hasConventionalFormat) {
      score += 25;
    }

    if (hasVerb) {
      score += 15;
    }

    if (hasScope) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Determines if message follows conventional commit format.
   */
  isConventional(message: string): boolean {
    return this.CONVENTIONAL_COMMIT_PATTERN.test(message);
  }

  /**
   * Extracts commit type from conventional commit message.
   */
  extractCommitType(message: string): string | null {
    const match = message.match(/^([a-z]+)(\(.+\))?:/);
    return match ? match[1] : null;
  }
}
