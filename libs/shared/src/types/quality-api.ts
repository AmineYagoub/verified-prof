import { IsEnum, IsOptional } from 'class-validator';

export interface QualityMetricsResponse {
  userId: string;
  overallScore: number;
  disciplineScore: number;
  clarityScore: number;
  testingScore: number;
  impactScore: number;
  consistencyScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  improvementVelocity: number;
  lastAnalyzedAt: Date;
  totalCommitsAnalyzed: number;
}

export interface TemporalDataPoint {
  date: string;
  score: number;
  commitsCount: number;
}

export class TemporalMetricsQuery {
  @IsOptional()
  @IsEnum(['30', '60', '90'])
  window?: '30' | '60' | '90';
}

export interface TemporalMetricsResponse {
  userId: string;
  window: '30' | '60' | '90';
  dataPoints: TemporalDataPoint[];
  averageScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  improvementRate: number;
}

export interface QualityMetrics {
  discipline: number;
  clarity: number;
  testing: number;
  impact: number;
}

export interface CommitEvidence {
  commitSha: string;
  message: string;
  score: number;
  url: string;
}

export interface AchievementQualityResponse {
  achievementId: string;
  title: string;
  qualityScore: number;
  explanation: string;
  strengths: string[];
  improvements: string[];
  metrics: QualityMetrics;
  evidence: CommitEvidence[];
}

export interface CommitMetricsResponse {
  commitSha: string;
  message: string;
  author: string;
  date: Date;
  overallScore: number;
  disciplineScore: number;
  clarityScore: number;
  impactScore: number;
  testingScore: number;
  consistencyScore: number;
  isDisciplined: boolean;
  isClear: boolean;
  hasAntiPatterns: boolean;
  suspicionScore: number;
  flagReasons: string[];
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
}
