export * from './logger';
export * from './auth';
export * from './encrypt';

export const PLAN_POLICIES: Record<
  'FREE' | 'PREMIUM',
  {
    plan: 'FREE' | 'PREMIUM';
    windowDays: number;
    maxCommits: number;
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
> = {
  FREE: {
    plan: 'FREE',
    windowDays: 30,
    maxCommits: 1000,
    maxRepositories: 5,
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
