/**
 * Job Event Names
 * Centralized event name constants for job orchestration
 */

export const JOB_EVENTS = {
  // Analysis Pipeline
  ANALYSIS_TRIGGERED: 'analysis.triggered',

  // Job Lifecycle
  JOB_STARTED: 'job.started',
  JOB_PROGRESS: 'job.progress',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',

  // Quality Analysis
  QUALITY_ANALYSIS_COMPLETED: 'quality.analysis.completed',

  // Achievement Extraction
  ACHIEVEMENT_EXTRACTION_COMPLETED: 'achievement.extraction.completed',

  // Badge Qualification
  BADGE_QUALIFICATION_COMPLETED: 'badge.qualification.completed',

  // Skill Inference
  SKILL_INFERENCE_COMPLETED: 'skill.inference.completed',
} as const;

export type JobEventName = (typeof JOB_EVENTS)[keyof typeof JOB_EVENTS];

/**
 * Job Event Classes
 * Event payloads for job orchestration
 */

export class JobStartedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

export class JobProgressEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly progress: number,
    public readonly currentStep?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

export class JobCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly result: unknown,
  ) {}
}

export class JobFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly error: string,
  ) {}
}

export class AnalysisTriggeredEvent {
  constructor(
    public readonly userId: string,
    public readonly plan: 'FREE' | 'PREMIUM',
  ) {}
}

export class QualityAnalysisCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly repositoryCount: number,
    public readonly commitCount: number,
  ) {}
}

export class AchievementExtractionCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly achievementCount: number,
  ) {}
}

export class BadgeQualificationCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly newBadgesEarned: number,
    public readonly totalBadges: number,
  ) {}
}

export class SkillInferenceCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly newSkillsAdded: number,
    public readonly totalSkills: number,
  ) {}
}
