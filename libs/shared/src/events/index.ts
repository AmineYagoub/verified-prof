/**
 * Job Event Names
 * Centralized event name constants for job orchestration
 */

export const JOB_EVENTS = {
  // Analysis Pipeline
  ANALYSIS_TRIGGERED: 'analysis.triggered',
  ANALYSIS_TAG_SUMMARY: 'analysis.tag_summary',
  ANALYSIS_PERSISTED: 'analysis.persisted',

  // Mission Generation
  MISSION_GENERATION_REQUESTED: 'mission.generation.requested',

  // Job Lifecycle
  JOB_STARTED: 'job.started',
  JOB_PROGRESS: 'job.progress',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',

  ACCOUNT_UPDATED: 'account.updated',
};
export type JobEventKeys = keyof typeof JOB_EVENTS;
export * from './jobs/trigger-analyzer.event';
export * from './jobs/tag-summary.event';
export * from './jobs/job-progress.event';
export * from './jobs/analysis-persisted.event';
export * from './missions/mission-generation-requested.event';
