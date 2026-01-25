import { Injectable, Logger } from '@nestjs/common';
import type { CommitData, PullRequestData } from '@verified-prof/shared';
import { GeminiService } from './gemini.service';
import {
  buildAchievementExtractionPrompt,
  buildBatchAchievementPrompt,
} from '../prompts/achievement-prompts';

export interface AchievementExtraction {
  hasAchievement: boolean;
  title?: string;
  description?: string;
  impact?: 'high' | 'medium' | 'low';
  category?:
    | 'feature'
    | 'performance'
    | 'bugfix'
    | 'refactor'
    | 'security'
    | 'infrastructure';
  skills?: string[];
  reasoning: string;
}

export interface BatchAchievementResult {
  achievements: Array<{
    prNumber: number;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    skills: string[];
  }>;
}

const ACHIEVEMENT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    hasAchievement: {
      type: 'boolean',
      description: 'Whether the PR contains a significant achievement',
    },
    title: {
      type: ['string', 'null'],
      description: 'Short title for the achievement',
    },
    description: {
      type: ['string', 'null'],
      description: 'Detailed description of what was accomplished',
    },
    impact: {
      type: ['string', 'null'],
      enum: ['high', 'medium', 'low', null],
      description: 'Impact level of the achievement',
    },
    category: {
      type: ['string', 'null'],
      enum: [
        'feature',
        'performance',
        'bugfix',
        'refactor',
        'security',
        'infrastructure',
        null,
      ],
      description: 'Category of the achievement',
    },
    skills: {
      type: ['array', 'null'],
      items: { type: 'string' },
      description: 'Skills demonstrated in this achievement',
    },
    reasoning: {
      type: 'string',
      description: 'Explanation of the decision',
    },
  },
  required: ['hasAchievement', 'reasoning'],
};

const BATCH_ACHIEVEMENT_SCHEMA = {
  type: 'object',
  properties: {
    achievements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prNumber: {
            type: 'integer',
            description: 'Pull request number',
          },
          title: {
            type: 'string',
            description: 'Achievement title',
          },
          description: {
            type: 'string',
            description: 'Achievement description',
          },
          impact: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Impact level',
          },
          category: {
            type: 'string',
            description: 'Achievement category',
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'Skills demonstrated',
          },
        },
        required: [
          'prNumber',
          'title',
          'description',
          'impact',
          'category',
          'skills',
        ],
      },
    },
  },
  required: ['achievements'],
};

@Injectable()
export class AchievementExtractorService {
  private readonly logger = new Logger(AchievementExtractorService.name);

  constructor(private readonly gemini: GeminiService) {}

  /**
   * Extracts a meaningful achievement from a pull request.
   * Returns null if PR doesn't contain significant work.
   */
  async extractAchievement(
    pr: PullRequestData,
    commits: CommitData[],
  ): Promise<AchievementExtraction> {
    try {
      const prompt = buildAchievementExtractionPrompt(pr, commits);

      const result = await this.gemini.generateJSON<AchievementExtraction>(
        prompt,
        ACHIEVEMENT_EXTRACTION_SCHEMA,
        {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      );

      this.logger.log(
        `Extracted achievement for PR #${pr.number}: ${result.hasAchievement ? result.title : 'None'}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to extract achievement from PR #${pr.number}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Batch extract achievements from multiple PRs.
   * More efficient than individual calls for large datasets.
   */
  async extractAchievementsBatch(
    prs: Array<{ pr: PullRequestData; commits: CommitData[] }>,
  ): Promise<BatchAchievementResult> {
    try {
      if (prs.length === 0) {
        return { achievements: [] };
      }

      const prompt = buildBatchAchievementPrompt(prs);

      const result = await this.gemini.generateJSON<BatchAchievementResult>(
        prompt,
        BATCH_ACHIEVEMENT_SCHEMA,
        {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      );

      this.logger.log(
        `Batch extracted ${result.achievements.length} achievements from ${prs.length} PRs`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to batch extract achievements', error);
      throw error;
    }
  }
}
