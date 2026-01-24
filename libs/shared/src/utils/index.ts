export * from './logger';
export * from './auth';
export * from './encrypt';

export const PLAN_POLICIES: Record<
  'FREE' | 'PREMIUM',
  {
    plan: 'FREE' | 'PREMIUM';
    windowDays: number;
    maxCommits: number;
    allowSampling: boolean;
    snapshotFrequency: 'monthly' | 'weekly';
  }
> = {
  FREE: {
    plan: 'FREE',
    windowDays: 30,
    maxCommits: 1000,
    allowSampling: true,
    snapshotFrequency: 'monthly',
  },
  PREMIUM: {
    plan: 'PREMIUM',
    windowDays: 365,
    maxCommits: 10000,
    allowSampling: true,
    snapshotFrequency: 'weekly',
  },
};
