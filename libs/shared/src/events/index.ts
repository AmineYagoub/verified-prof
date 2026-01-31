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

  ACCOUNT_UPDATED: 'account.updated',
  ANALYSIS_TAG_SUMMARY: 'analysis.tag_summary',
};
export type JobEventKeys = keyof typeof JOB_EVENTS;
export * from './jobs/trigger-analyzer.event';
export * from './jobs/tag-summary.event';
export * from './jobs/job-progress.event';
