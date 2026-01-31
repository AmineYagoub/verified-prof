export * from './logger';
export * from './auth';
export * from './encrypt';

export interface PlanPolicy {
  plan: 'FREE' | 'PREMIUM';
  windowDays: number;
  maxCommits: number;
  maxFilesPerCommit: number;
  maxRepositories: number;
  commitsPerPage: number;
  repositoriesPerPage: number;
  allowSampling: boolean;
  snapshotFrequency: 'monthly' | 'weekly';
  aiExplanations: {
    enabled: boolean;
    maxCommitsForAI: number;
    maxExplanationsPerAnalysis: number;
  };
  rateLimit: {
    maxAnalysisPerDay: number;
    maxAnalysisPerMonth: number;
  };
}

export const PLAN_POLICIES: Record<'FREE' | 'PREMIUM', PlanPolicy> = {
  FREE: {
    plan: 'FREE',
    windowDays: 90,
    maxCommits: 10,
    maxRepositories: 10,
    maxFilesPerCommit: 25,
    commitsPerPage: 100,
    repositoriesPerPage: 10,
    allowSampling: true,
    snapshotFrequency: 'monthly',
    aiExplanations: {
      enabled: true,
      maxCommitsForAI: 20,
      maxExplanationsPerAnalysis: 5,
    },
    rateLimit: {
      maxAnalysisPerDay: 3,
      maxAnalysisPerMonth: 30,
    },
  },
  PREMIUM: {
    plan: 'PREMIUM',
    windowDays: 365,
    maxCommits: 10000,
    maxRepositories: 50,
    maxFilesPerCommit: 100,
    commitsPerPage: 100,
    repositoriesPerPage: 50,
    allowSampling: true,
    snapshotFrequency: 'weekly',
    aiExplanations: {
      enabled: true,
      maxCommitsForAI: 100,
      maxExplanationsPerAnalysis: 20,
    },
    rateLimit: {
      maxAnalysisPerDay: 20,
      maxAnalysisPerMonth: 300,
    },
  },
};
