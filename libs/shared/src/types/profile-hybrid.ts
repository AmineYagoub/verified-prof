export type SeniorityRank = 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
export type Trend = 'IMPROVING' | 'STABLE' | 'DECLINING';
export type LearningCurveTrend = 'Exponential' | 'Steady' | 'Specialist';
export type MissionImpact = 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix';
export type MentorshipType = 'GIVEN' | 'RECEIVED';

export interface CoreMetricsApiResponse {
  userId: string;
  codeImpact: number;
  cycleTime: number;
  logicDensity: number;
  systemComplexityScore: number;
  velocityPercentile: number;
  seniorityRank: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
  specialization: string;
  sTierVerificationHash: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
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
  week: string;
  date: string;
  impact: MissionImpact;
  title: string;
  architecturalFeat?: string;
  summary: string;
  achievements: string[];
  domainContext: string;
  complexityAdded: number;
  commitCount: number;
  filesChanged: number;
  isHeroMission: boolean;
}

export interface MissionTimeline {
  missions: Mission[];
}

export interface CognitivePattern {
  pattern: string;
  frequency: number;
  examples: string[];
}

export interface CognitiveStyle {
  codingPhilosophy: string;
  strengths: string[];
  mentalModel: string;
  abstractionLevel: number;
  consistencyScore: number;
  namingQuality: number;
  documentationRatio: number;
  preferredPatterns: CognitivePattern[];
}

export interface MentorshipActivity {
  type: MentorshipType;
  prNumber: number;
  repository: string;
  commentCount: number;
  depth: number;
  date: string;
}

export interface MentorshipRatio {
  reviewQualityScore: number;
  knowledgeSharingIndex: number;
  topAdviceTag: string;
  mentorshipRatio: number;
  reviewsGiven: number;
  reviewsReceived: number;
  topMentees: string[];
  topMentors: string[];
  recentActivity: MentorshipActivity[];
}

export interface ChurnHotspot {
  filePath: string;
  churnCount: number;
  lastModified: string;
  stabilized: boolean;
}

export interface ReliabilityScore {
  codeSurvivalRate: number;
  bugDensity: number;
  refactorResistance: number;
  refactorRatio: number;
  modularityScore: number;
  churnStabilization: number;
  hotspots: ChurnHotspot[];
  architecturalDecisions: string[];
  avgFileLifespan: number;
}

export interface UserProfileResponse {
  userId: string;
  name: string;
  image: string | null;
  lastAnalyzedAt?: string;
  analysisProgress?: number;
  coreMetrics?: CoreMetricsApiResponse;
  techStackDNA?: TechStackDNA;
  missionTimeline?: MissionTimeline;
  cognitiveStyle?: CognitiveStyle;
  mentorshipRatio?: MentorshipRatio;
  reliabilityScore?: ReliabilityScore;
}

export interface ProfileAvatarUploadResult {
  url: string;
  filename: string;
}
