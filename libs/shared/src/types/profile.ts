export type SeniorityRank = 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
export type Trend = 'IMPROVING' | 'STABLE' | 'DECLINING';
export type LearningCurveTrend = 'Exponential' | 'Steady' | 'Specialist';
export type MissionImpact = 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix';

import { TechnologyStackResponse } from './technology-stack';

export interface CoreMetricsApiResponse {
  userId: string;
  codeImpact: number;
  cycleTime: number;
  logicDensity: number;
  systemComplexityScore: number;
  velocityPercentile: number;
  seniorityRank: SeniorityRank;
  specialization: string;
  sTierVerificationHash: string;
  trend: Trend | null;
  periodStart: string | null;
  periodEnd: string | null;
  lastVerifiedAt: string | null;
}

export interface WeeklyIntensity {
  week: string;
  intensity: number;
  complexityScore: number;
  linesWritten: number;
  filesModified: number;
}

export interface LanguageExpertise {
  name: string;
  expertise: number;
  daysToMastery: number;
  topLibraryPatterns: string[];
  weeklyIntensity: WeeklyIntensity[];
  firstSeen: string;
  lastUsed: string;
  weeksActive: number;
}

export interface TechStackDNA {
  languages: LanguageExpertise[];
  learningCurveTrend: LearningCurveTrend;
  dominantLanguages: string[];
}

export interface Mission {
  id: string;
  date: string;
  impact: MissionImpact;
  title: string;
  architecturalFeat?: string;
  summary: string;
  achievements: string[];
  patterns: string[];
  domainContext: string;
  complexityAdded: number;
  commitCount: number;
  filesChanged: number;
  isHeroMission: boolean;
}

export interface MissionTimeline {
  missions: Mission[];
}

export interface UserProfileResponse {
  userId: string;
  name: string;
  image: string | null;
  slug?: string;
  bio?: string;
  lastAnalyzedAt?: string;
  analysisProgress?: number;
  coreMetrics?: CoreMetricsApiResponse;
  techStackDNA?: TechStackDNA;
  technologyStack?: TechnologyStackResponse[];
  missionTimeline?: MissionTimeline;
}

export interface ProfileAvatarUploadResult {
  url: string;
  filename: string;
}
