import type { AnalysisJob, AnalysisSnapshot, JobStatus, SnapshotStatus, TriggerType, ProviderType } from './prisma';

export interface AnalysisJobWithRelations extends AnalysisJob {
  snapshots?: AnalysisSnapshot[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    githubUsername: string | null;
  };
}

export interface CreateAnalysisJobRequest {
  userId: string;
  username: string;
  provider?: ProviderType;
  triggerType?: TriggerType;
}

export interface AnalysisJobResponse {
  id: string;
  status: JobStatus;
  progress: number;
  currentStep?: string;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface AnalysisSnapshotResponse {
  id: string;
  userId: string;
  jobId: string;
  status: SnapshotStatus;
  createdAt: Date;
  summary: {
    totalAchievements: number;
    totalBadges: number;
    totalSkills: number;
  };
}
