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

const QUALITY_EXPLANATION_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'A brief summary of the commit quality',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of strengths in the commit',
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of suggested improvements',
    },
    tone: {
      type: 'string',
      enum: ['positive', 'neutral', 'constructive'],
      description: 'The tone of the feedback',
    },
  },
  required: ['summary', 'strengths', 'improvements', 'tone'],
};

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
        QUALITY_EXPLANATION_SCHEMA,
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
      throw error;
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
      const explanation = await this.generateExplanation(
        commit.sha,
        commit.message,
        commit.metrics,
      );
      results.set(commit.sha, explanation);
    }

    return results;
  }
}
