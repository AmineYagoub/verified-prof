export * from './logger';
export * from './auth';
export * from './encrypt';

export interface PlanPolicy {
  plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  windowDays: number;
  maxCommits: number;
  maxFilesPerCommit: number;
  maxRepositories: number;
  commitsPerPage: number;
  repositoriesPerPage: number;
}

export const PLAN_POLICIES: Record<
  'FREE' | 'PREMIUM' | 'ENTERPRISE',
  PlanPolicy
> = {
  FREE: {
    plan: 'FREE',
    windowDays: 90,
    maxCommits: 1000,
    maxRepositories: 10,
    maxFilesPerCommit: 25,
    commitsPerPage: 50,
    repositoriesPerPage: 50,
  },
  PREMIUM: {
    plan: 'PREMIUM',
    windowDays: 365,
    maxCommits: 10000,
    maxRepositories: 50,
    maxFilesPerCommit: 100,
    commitsPerPage: 50,
    repositoriesPerPage: 50,
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    windowDays: 730,
    maxCommits: 50000,
    maxRepositories: 200,
    maxFilesPerCommit: 200,
    commitsPerPage: 100,
    repositoriesPerPage: 100,
  },
};
