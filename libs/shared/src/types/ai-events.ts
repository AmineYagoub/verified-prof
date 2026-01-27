/**
 * AI Event Names
 * Centralized event name constants for AI service communication
 */

export const AI_EVENTS = {
  // Achievement Extraction
  ACHIEVEMENT_EXTRACTION_REQUESTED: 'ai.achievement.extraction.requested',
  ACHIEVEMENT_EXTRACTION_COMPLETED: 'ai.achievement.extraction.completed',

  // Quality Explanation
  QUALITY_EXPLANATION_REQUESTED: 'ai.quality.explanation.requested',
  QUALITY_EXPLANATION_COMPLETED: 'ai.quality.explanation.completed',

  // Badge Description
  BADGE_DESCRIPTION_REQUESTED: 'ai.badge.description.requested',
  BADGE_DESCRIPTION_COMPLETED: 'ai.badge.description.completed',

  // Skill Validation
  SKILL_VALIDATION_REQUESTED: 'ai.skill.validation.requested',
  SKILL_VALIDATION_COMPLETED: 'ai.skill.validation.completed',

  // Profile Summary
  PROFILE_SUMMARY_REQUESTED: 'ai.profile.summary.requested',
  PROFILE_SUMMARY_COMPLETED: 'ai.profile.summary.completed',

  // Error Handling
  REQUEST_FAILED: 'ai.request.failed',
} as const;

export type AIEventName = (typeof AI_EVENTS)[keyof typeof AI_EVENTS];

export class ProfileSummaryRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly type: 'bio' | 'skills' | 'quality',
  ) {}
}

export class ProfileSummaryCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly type: 'bio' | 'skills' | 'quality',
    public readonly summary: string,
  ) {}
}
