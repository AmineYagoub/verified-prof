/**
 * Shared types for the missions module
 */

export interface MissionTagSummary {
  id: string;
  repoFullName: string;
  commitSha: string;
  filePath: string;
  complexity: number;
  functions?: string[];
  classes?: string[];
  imports?: string[];
  metadata?: {
    language?: string;
    commitMessage?: string;
    authorDate?: string;
    decorators?: string[];
  };
  createdAt: Date;
}

export type MissionImpactEnum = 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix';

export interface MissionData {
  week: string;
  date: Date;
  impact: MissionImpactEnum;
  title: string;
  architecturalFeat: string | null;
  summary: string;
  achievements: string[];
  domainContext: string;
  complexityAdded: number;
  commitCount: number;
  filesChanged: number;
  isHeroMission: boolean;
}

export interface CommitContext {
  commitSha: string;
  commitMessage: string;
  commitMessages: string[];
  totalComplexity: number;
  filesChanged: number;
  date: Date;
  commitCount: number;
  duration: number;
  languages: string[];
  totalFunctions: number;
  totalClasses: number;
  topImports: string[];
  decorators: string[];
}
