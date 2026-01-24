import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GeminiService } from './gemini.service';
import { AI_EVENTS } from '@verified-prof/shared';
import {
  AchievementExtractionRequestedEvent,
  AchievementExtractionCompletedEvent,
  QualityExplanationRequestedEvent,
  QualityExplanationCompletedEvent,
  BadgeDescriptionRequestedEvent,
  BadgeDescriptionCompletedEvent,
  SkillValidationRequestedEvent,
  SkillValidationCompletedEvent,
  AIRequestFailedEvent,
} from '../events/ai.events';
import { buildAchievementExtractionPrompt } from '../prompts/achievement-prompts';
import { buildBadgeDescriptionPrompt } from '../prompts/badge-prompts';
import { buildSkillValidationPrompt } from '../prompts/skill-prompts';
import { buildSimplifiedQualityPrompt } from '../prompts/quality-prompts';
import type { PullRequestData } from '@verified-prof/shared';

/**
 * AI Orchestration Service
 * Central event-driven handler for all AI requests
 * Ready for isolated deployment as microservice
 */
@Injectable()
export class AiOrchestrationService {
  private readonly logger = new Logger(AiOrchestrationService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handle achievement extraction requests
   */
  @OnEvent(AI_EVENTS.ACHIEVEMENT_EXTRACTION_REQUESTED)
  async handleAchievementExtractionRequest(
    event: AchievementExtractionRequestedEvent,
  ): Promise<void> {
    this.logger.log(
      `Processing achievement extraction request: ${event.requestId}`,
    );

    try {
      const prData: Partial<PullRequestData> = {
        title: event.prTitle,
        body: event.prDescription,
        additions: event.metrics.linesAdded,
        deletions: event.metrics.linesDeleted,
        changedFiles: event.metrics.filesChanged,
        comments: event.metrics.reviewComments,
        number: event.prNumber,
        state: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        mergedAt: null,
        author: { username: '', url: '' },
      };

      const prompt = buildAchievementExtractionPrompt(
        prData as PullRequestData,
        [],
      );

      const response = await this.gemini.generateJSON<{
        hasAchievement: boolean;
        title?: string;
        description?: string;
        impact?: string;
        category?: string;
        skills?: string[];
        reasoning?: string;
      }>(prompt, {
        temperature: 0.3,
        maxOutputTokens: 512,
      });

      if (!response.hasAchievement) {
        this.logger.debug(
          `No achievement found for PR ${event.prNumber}: ${response.reasoning}`,
        );
        this.eventEmitter.emit(
          AI_EVENTS.ACHIEVEMENT_EXTRACTION_COMPLETED,
          new AchievementExtractionCompletedEvent(
            event.requestId,
            event.userId,
            [],
          ),
        );
        return;
      }

      const achievements = [
        {
          title: response.title || 'Achievement',
          description: response.description || '',
          category: response.category || 'FEATURE',
          impact: response.impact || 'MEDIUM',
          skills: response.skills || [],
          confidence: 0.85,
          proof: {
            type: 'PULL_REQUEST',
            url: `https://github.com/pr/${event.prNumber}`,
            description: `PR #${event.prNumber}: ${event.prTitle}`,
          },
        },
      ];

      this.eventEmitter.emit(
        AI_EVENTS.ACHIEVEMENT_EXTRACTION_COMPLETED,
        new AchievementExtractionCompletedEvent(
          event.requestId,
          event.userId,
          achievements,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Achievement extraction failed for request ${event.requestId}`,
        error,
      );
      this.eventEmitter.emit(
        AI_EVENTS.REQUEST_FAILED,
        new AIRequestFailedEvent(
          event.requestId,
          event.userId,
          'achievement_extraction',
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  }

  /**
   * Handle quality explanation requests
   */
  @OnEvent(AI_EVENTS.QUALITY_EXPLANATION_REQUESTED)
  async handleQualityExplanationRequest(
    event: QualityExplanationRequestedEvent,
  ): Promise<void> {
    this.logger.log(
      `Processing quality explanation request: ${event.requestId}`,
    );

    try {
      const prompt = buildSimplifiedQualityPrompt(
        event.commitSha,
        event.metrics,
      );

      const response = await this.gemini.generateJSON<{
        summary: string;
        strengths: string[];
        improvements: string[];
        tone: string;
      }>(prompt, {
        temperature: 0.5,
        maxOutputTokens: 384,
      });

      this.eventEmitter.emit(
        AI_EVENTS.QUALITY_EXPLANATION_COMPLETED,
        new QualityExplanationCompletedEvent(
          event.requestId,
          event.userId,
          event.commitSha,
          response.summary,
          response.improvements,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Quality explanation failed for request ${event.requestId}`,
        error,
      );
      this.eventEmitter.emit(
        AI_EVENTS.REQUEST_FAILED,
        new AIRequestFailedEvent(
          event.requestId,
          event.userId,
          'quality_explanation',
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  }

  /**
   * Handle badge description requests
   */
  @OnEvent(AI_EVENTS.BADGE_DESCRIPTION_REQUESTED)
  async handleBadgeDescriptionRequest(
    event: BadgeDescriptionRequestedEvent,
  ): Promise<void> {
    this.logger.log(`Processing badge description request: ${event.requestId}`);

    try {
      const prompt = buildBadgeDescriptionPrompt(
        event.badgeType,
        {
          name: event.badgeType,
          description: 'Badge description',
          requirements: [],
        },
        {
          totalCommits: event.evidence.commits || 0,
          commitsLast90Days: event.evidence.commits || 0,
          avgQualityScore: event.evidence.qualityScore || 0,
          consecutiveDays: event.evidence.streak || 0,
          achievementCounts: {},
        },
      );

      const response = await this.gemini.generateJSON<{
        description: string;
      }>(prompt, {
        temperature: 0.7,
        maxOutputTokens: 256,
      });

      this.eventEmitter.emit(
        AI_EVENTS.BADGE_DESCRIPTION_COMPLETED,
        new BadgeDescriptionCompletedEvent(
          event.requestId,
          event.userId,
          event.badgeType,
          event.badgeId,
          response.description,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Badge description failed for request ${event.requestId}`,
        error,
      );
      this.eventEmitter.emit(
        AI_EVENTS.REQUEST_FAILED,
        new AIRequestFailedEvent(
          event.requestId,
          event.userId,
          'badge_description',
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  }

  /**
   * Handle skill validation requests
   */
  @OnEvent(AI_EVENTS.SKILL_VALIDATION_REQUESTED)
  async handleSkillValidationRequest(
    event: SkillValidationRequestedEvent,
  ): Promise<void> {
    this.logger.log(`Processing skill validation request: ${event.requestId}`);

    try {
      const prompt = buildSkillValidationPrompt(event.skillName, {
        name: event.skillName,
        category: 'LANGUAGE',
        level: event.currentLevel,
        evidenceCount: event.evidence.length,
        firstUsed: new Date(event.evidence[0]?.date || Date.now()),
        lastUsed: new Date(
          event.evidence[event.evidence.length - 1]?.date || Date.now(),
        ),
        confidence: null,
        evidence: event.evidence.map((e) => ({
          evidenceType: e.type,
          resourceUrl: e.description,
          occurredAt: new Date(e.date),
        })),
      });

      const response = await this.gemini.generateJSON<{
        valid: boolean;
        suggestedLevel: string;
        feedback: string;
      }>(prompt, {
        temperature: 0.3,
        maxOutputTokens: 256,
      });

      this.eventEmitter.emit(
        AI_EVENTS.SKILL_VALIDATION_COMPLETED,
        new SkillValidationCompletedEvent(
          event.requestId,
          event.userId,
          event.skillName,
          response.valid,
          response.suggestedLevel,
          response.feedback,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Skill validation failed for request ${event.requestId}`,
        error,
      );
      this.eventEmitter.emit(
        AI_EVENTS.REQUEST_FAILED,
        new AIRequestFailedEvent(
          event.requestId,
          event.userId,
          'skill_validation',
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  }
}
