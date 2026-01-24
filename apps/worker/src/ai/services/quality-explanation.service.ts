import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { buildQualityExplanationPrompt } from '../prompts/quality-prompts';
import type { QualityMetricsResult } from '../../quality/services/commit-scorer.service';

export interface QualityExplanation {
  summary: string;
  strengths: string[];
  improvements: string[];
  tone: 'positive' | 'neutral' | 'constructive';
}

@Injectable()
export class QualityExplanationService {
  private readonly logger = new Logger(QualityExplanationService.name);

  constructor(private readonly gemini: GeminiService) {}

  /**
   * Generates human-readable explanation for commit quality score.
   * Provides actionable feedback and encouragement.
   */
  async generateExplanation(
    sha: string,
    message: string,
    metrics: QualityMetricsResult,
  ): Promise<QualityExplanation> {
    try {
      const prompt = buildQualityExplanationPrompt({
        sha,
        message,
        metrics,
      });

      const result = await this.gemini.generateJSON<QualityExplanation>(
        prompt,
        {
          temperature: 0.5,
          maxOutputTokens: 300,
        },
      );

      this.logger.debug(
        `Generated explanation for commit ${sha.substring(0, 8)}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to generate explanation for ${sha.substring(0, 8)}`,
        error,
      );

      return this.getFallbackExplanation(metrics);
    }
  }

  /**
   * Generates explanations for multiple commits in batch.
   * More efficient for bulk processing.
   */
  async generateExplanationsBatch(
    commits: Array<{
      sha: string;
      message: string;
      metrics: QualityMetricsResult;
    }>,
  ): Promise<Map<string, QualityExplanation>> {
    const results = new Map<string, QualityExplanation>();

    for (const commit of commits) {
      try {
        const explanation = await this.generateExplanation(
          commit.sha,
          commit.message,
          commit.metrics,
        );
        results.set(commit.sha, explanation);
      } catch (error) {
        this.logger.error(
          `Failed to generate explanation for ${commit.sha}`,
          error,
        );
        results.set(commit.sha, this.getFallbackExplanation(commit.metrics));
      }
    }

    return results;
  }

  /**
   * Provides deterministic fallback when AI fails.
   * Based purely on quality metrics thresholds.
   */
  private getFallbackExplanation(
    metrics: QualityMetricsResult,
  ): QualityExplanation {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (metrics.isDisciplined) {
      strengths.push('Focused scope with appropriate size');
    } else {
      improvements.push('Consider breaking into smaller, atomic commits');
    }

    if (metrics.isClear) {
      strengths.push('Clear commit message following conventions');
    } else {
      improvements.push('Use conventional commit format (feat:, fix:, etc.)');
    }

    if (metrics.testingScore >= 70) {
      strengths.push('Good test coverage');
    } else if (metrics.testingScore < 50) {
      improvements.push('Add test coverage for changed code');
    }

    if (metrics.hasAntiPatterns) {
      improvements.push('Review flagged anti-patterns');
    }

    let summary = '';
    let tone: 'positive' | 'neutral' | 'constructive' = 'neutral';

    if (metrics.overallScore >= 80) {
      summary = 'Excellent work! This commit demonstrates high quality.';
      tone = 'positive';
    } else if (metrics.overallScore >= 60) {
      summary = 'Good work with room for improvement.';
      tone = 'neutral';
    } else {
      summary = 'This commit could be improved.';
      tone = 'constructive';
    }

    return {
      summary,
      strengths: strengths.length > 0 ? strengths : ['Commit completed'],
      improvements:
        improvements.length > 0 ? improvements : ['Keep up the good work'],
      tone,
    };
  }

  /**
   * Formats explanation as markdown for display.
   */
  formatAsMarkdown(explanation: QualityExplanation): string {
    let markdown = `**${explanation.summary}**\n\n`;

    if (explanation.strengths.length > 0) {
      markdown += '### ✅ Strengths\n';
      explanation.strengths.forEach((s) => {
        markdown += `- ${s}\n`;
      });
      markdown += '\n';
    }

    if (explanation.improvements.length > 0) {
      markdown += '### 💡 Suggestions\n';
      explanation.improvements.forEach((i) => {
        markdown += `- ${i}\n`;
      });
    }

    return markdown;
  }

  /**
   * Formats explanation as plain text for logs/emails.
   */
  formatAsPlainText(explanation: QualityExplanation): string {
    let text = `${explanation.summary}\n\n`;

    if (explanation.strengths.length > 0) {
      text += 'Strengths:\n';
      explanation.strengths.forEach((s) => {
        text += `  - ${s}\n`;
      });
      text += '\n';
    }

    if (explanation.improvements.length > 0) {
      text += 'Suggestions:\n';
      explanation.improvements.forEach((i) => {
        text += `  - ${i}\n`;
      });
    }

    return text;
  }
}
