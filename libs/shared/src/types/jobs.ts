/**
 * Job Orchestration Types
 * Defines event-driven job flow for analysis pipeline
 */

export const enum JobType {
  QUALITY_ANALYSIS = 'quality_analysis',
  ACHIEVEMENT_EXTRACTION = 'achievement_extraction',
  BADGE_CALCULATION = 'badge_calculation',
  SKILL_INFERENCE = 'skill_inference',
}

export interface JobProgress {
  jobId: string;
  userId: string;
  type: JobType;
  status: string; // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number; // 0-100
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  jobId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AnalysisJobMetadata {
  totalRepositories: number;
  analyzedRepositories: number;
  totalCommits: number;
  analyzedCommits: number;
}

export interface AchievementJobMetadata {
  totalPullRequests: number;
  extractedAchievements: number;
  validatedAchievements: number;
}

export interface BadgeJobMetadata {
  totalBadges: number;
  qualifiedBadges: number;
  earnedBadges: number;
}
