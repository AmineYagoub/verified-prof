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
      return {
        hasAchievement: false,
        reasoning: 'AI extraction failed',
      };
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
      return { achievements: [] };
    }
  }

  /**
   * Validates if an achievement meets quality standards.
   * Filters out trivial or poorly described achievements.
   */
  validateAchievement(achievement: AchievementExtraction): boolean {
    if (!achievement.hasAchievement) return false;
    if (!achievement.title || achievement.title.length < 10) return false;
    if (!achievement.description || achievement.description.length < 20)
      return false;
    if (!achievement.skills || achievement.skills.length === 0) return false;

    const trivialKeywords = [
      'typo',
      'formatting',
      'whitespace',
      'comment',
      'renamed',
      'moved file',
    ];
    const titleLower = achievement.title.toLowerCase();
    if (trivialKeywords.some((kw) => titleLower.includes(kw))) {
      return false;
    }

    return true;
  }

  /**
   * Enhances achievement with additional context.
   * Adds proof URL, timestamps, repository info.
   */
  enrichAchievement(
    extraction: AchievementExtraction,
    pr: PullRequestData,
    repositoryFullName: string,
  ): AchievementExtraction & {
    proofUrl: string;
    achievedAt: Date;
    repositoryName: string;
    prNumber: number;
  } {
    return {
      ...extraction,
      proofUrl: pr.htmlUrl,
      achievedAt: pr.mergedAt || pr.closedAt || pr.createdAt,
      repositoryName: repositoryFullName,
      prNumber: pr.number,
    };
  }
}
