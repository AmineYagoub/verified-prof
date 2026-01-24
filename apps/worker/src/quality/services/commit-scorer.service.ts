import { Injectable } from '@nestjs/common';
import type {
  CommitData,
  DomainConfig,
  QualityWeightingProfile,
} from '@verified-prof/shared';
import { DisciplineCalculatorService } from './discipline-calculator.service';
import { ClarityAnalyzerService } from './clarity-analyzer.service';

export interface QualityMetricsResult {
  commitSha: string;
  overallScore: number;
  disciplineScore: number;
  clarityScore: number;
  impactScore: number;
  consistencyScore: number;
  scopeScore: number;
  messageScore: number;
  reviewScore: number;
  testingScore: number;
  documentationScore: number;
  isDisciplined: boolean;
  isClear: boolean;
  isImpactful: boolean;
  isConsistent: boolean;
  hasAntiPatterns: boolean;
  suspicionScore: number;
  flagReasons: string[];
  repositoryName: string;
  detectedLanguages: string[];
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  analyzedAt: Date;
}

@Injectable()
export class CommitScorerService {
  constructor(
    private readonly disciplineCalculator: DisciplineCalculatorService,
    private readonly clarityAnalyzer: ClarityAnalyzerService,
  ) {}

  /**
   * Calculates comprehensive quality metrics for a commit.
   * Combines discipline, clarity, impact, and consistency scores.
   * Returns full quality metrics result with weighted overall score.
   */
  calculateCommitQuality(
    commit: CommitData,
    config: DomainConfig,
    weights: QualityWeightingProfile,
    trivialThreshold: number,
  ): QualityMetricsResult {
    const additions = commit.additions || 0;
    const deletions = commit.deletions || 0;
    const linesChanged = additions + deletions;
    const filesChanged = commit.filesChanged || 0;

    const disciplineResult = this.disciplineCalculator.calculateDiscipline(
      commit,
      config,
      trivialThreshold,
    );

    const clarityResult = this.clarityAnalyzer.analyzeClarity(commit);

    const impactScore = this.calculateImpactScore(
      additions,
      config.maxLinesPerCommit,
    );
    const consistencyScore = 100;
    const scopeScore = this.disciplineCalculator.calculateScopeScore(
      linesChanged,
      config,
    );
    const messageScore = this.clarityAnalyzer.calculateMessageScore(
      commit.message?.length || 0,
    );
    const reviewScore = filesChanged > 0 ? 100 : 50;
    const testingScore = 50;
    const documentationScore = 50;

    const overall = this.calculateWeightedOverallScore(
      disciplineResult.score,
      clarityResult.score,
      impactScore,
      consistencyScore,
      weights,
    );

    return {
      commitSha: commit.sha,
      overallScore: overall,
      disciplineScore: disciplineResult.score,
      clarityScore: clarityResult.score,
      impactScore,
      consistencyScore,
      scopeScore,
      messageScore,
      reviewScore,
      testingScore,
      documentationScore,
      isDisciplined: disciplineResult.isDisciplined,
      isClear: clarityResult.isClear,
      isImpactful: impactScore >= 50,
      isConsistent: consistencyScore >= 60,
      hasAntiPatterns: false,
      suspicionScore: 0,
      flagReasons: [
        ...disciplineResult.violations,
        ...clarityResult.violations,
      ],
      repositoryName: `${commit.provider}:${commit.sha}`,
      detectedLanguages: [],
      filesChanged,
      linesAdded: additions,
      linesDeleted: deletions,
      analyzedAt: new Date(),
    };
  }

  /**
   * Calculates impact score based on lines added.
   * Higher additions indicate more impactful changes.
   */
  private calculateImpactScore(
    additions: number,
    maxLinesPerCommit: number,
  ): number {
    return Math.min(
      100,
      Math.round((additions / Math.max(1, maxLinesPerCommit)) * 100),
    );
  }

  /**
   * Calculates weighted overall score from individual components.
   */
  private calculateWeightedOverallScore(
    disciplineScore: number,
    clarityScore: number,
    impactScore: number,
    consistencyScore: number,
    weights: QualityWeightingProfile,
  ): number {
    const totalWeight =
      weights.disciplineWeight +
      weights.clarityWeight +
      weights.impactWeight +
      weights.consistencyWeight;

    const weighted =
      disciplineScore * weights.disciplineWeight +
      clarityScore * weights.clarityWeight +
      impactScore * weights.impactWeight +
      consistencyScore * weights.consistencyWeight;

    return Math.round(weighted / totalWeight);
  }
}
