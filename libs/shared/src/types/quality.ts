/**
 * Quality Metrics Types
 * Defines all interfaces for commit quality analysis, temporal aggregations, and anti-gaming
 */

/**
 * Request to analyze achievements from pull requests
 */
export interface AchievementAnalysisRequest {
  maxReposPerUser?: number;
  maxPRsPerRepo?: number;
}

/**
 * Request to analyze achievements from a specific repository
 */
export interface RepoAchievementAnalysisRequest {
  owner: string;
  repo: string;
  maxPullRequests?: number;
}

/**
 * Individual commit quality analysis result
 */
export interface QualityMetricsResult {
  commitSha: string;
  overallScore: number;
  disciplineScore: number;
  clarityScore: number;
  impactScore: number;
  consistencyScore: number;

  // Component scores
  scopeScore: number;
  messageScore: number;
  reviewScore: number;
  testingScore: number;
  documentationScore: number;

  // Flags
  isDisciplined: boolean;
  isClear: boolean;
  isImpactful: boolean;
  isConsistent: boolean;
  hasAntiPatterns: boolean;

  // Anti-gaming signals
  suspicionScore: number;
  flagReasons: string[];

  // Metadata
  repositoryName: string;
  detectedLanguages: string[];
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  analyzedAt: Date;
}

/**
 * Temporal metrics aggregated over time windows (30/60/90 days)
 */
export interface TemporalMetrics {
  userId: string;
  windowDays: 30 | 60 | 90;

  // Aggregate scores
  avgOverallScore: number;
  avgDiscipline: number;
  avgClarity: number;
  avgImpact: number;
  avgConsistency: number;

  // Volume metrics
  totalCommits: number;
  disciplinedCommits: number;
  clearCommits: number;
  impactfulCommits: number;

  // Quality trends
  trendDirection: 'improving' | 'stable' | 'declining';
  trendStrength: number; // 0-1

  // Anti-gaming metrics
  flaggedCommits: number;
  suspicionRate: number; // percentage 0-100

  // Timestamps
  windowStart: Date;
  windowEnd: Date;
  calculatedAt: Date;
}

/**
 * Temporal trend analysis showing progression over time
 */
export interface TemporalTrend {
  metric: 'overall' | 'discipline' | 'clarity' | 'impact' | 'consistency';
  window30: number;
  window60: number;
  window90: number;
  direction: 'improving' | 'stable' | 'declining';
  strength: number; // 0-1, how strong the trend is
  changePercent: number; // % change from 90 days to 30 days
  projectedScore: number; // Where user is headed based on trend
}

/**
 * Quality violation incident (anti-gaming)
 */
export interface ViolationIncident {
  id: string;
  userId: string;
  commitSha: string;
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  evidence: Record<string, unknown>;
  penaltyApplied: boolean;
  penaltyAmount?: number;
  detected: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: 'false_positive' | 'confirmed' | 'manual_review';
}

export type ViolationType =
  | 'rapid_commits'
  | 'trivial_changes'
  | 'mass_deletions'
  | 'pattern_gaming';

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Domain-specific configuration (Backend, Frontend, ML, DevOps)
 */
export interface DomainConfig {
  name: string;
  maxLinesPerCommit: number;
  maxFilesPerCommit: number;
  minLinesForReview: number;
  primaryLanguages: string[];
  frameworkContext: string[];
}

/**
 * Quality weighting profile for custom scoring
 */
export interface QualityWeightingProfile {
  userId: string;
  profileName: string;
  isActive: boolean;

  // Size thresholds
  maxLinesPerCommit: number;
  maxFilesPerCommit: number;
  minLinesForReview: number;

  // Weight adjustments (multipliers)
  disciplineWeight: number;
  clarityWeight: number;
  impactWeight: number;
  consistencyWeight: number;

  // Language preferences
  primaryLanguages: string[];
  frameworkContext: string[];
}

/**
 * Quality analysis request parameters
 */
export interface QualityAnalysisRequest {
  userId: string;
  owner: string;
  repo: string;
  since?: Date;
  until?: Date;
  branch?: string;
  domainType?: 'backend' | 'frontend' | 'ml' | 'devops';
}

/**
 * Quality analysis response with results
 */
export interface QualityAnalysisResponse {
  userId: string;
  repository: string;
  commitsAnalyzed: number;
  metricsResults: QualityMetricsResult[];
  temporalMetrics: TemporalMetrics;
  trends: TemporalTrend[];
  violations: ViolationIncident[];
  summary: {
    averageScore: number;
    bestScore: number;
    worstScore: number;
    flaggedCount: number;
    improvementAreas: string[];
  };
  analyzedAt: Date;
}

/**
 * Anti-gaming scoring configuration
 */
export interface AntiGamingConfig {
  rapidCommitThreshold: number; // number of commits
  rapidCommitWindow: number; // milliseconds
  trivialLinesThreshold: number; // lines of code
  massDeleteThreshold: number; // lines deleted
  suspicionScoreThreshold: number; // 0-100
  violationPenalty: number; // points deducted per violation
}

/**
 * Scoring thresholds and ranges
 */
export interface ScoringConfig {
  minScore: number;
  maxScore: number;
  excellentThreshold: number;
  goodThreshold: number;
  passingThreshold: number;
}

/**
 * Quality metrics detector for analysis
 */
export interface QualityDetector {
  detectDiscipline(
    filesChanged: number,
    linesAdded: number,
    linesDeleted: number,
    maxLinesPerCommit: number,
  ): number;

  detectClarity(message: string, body: string, filesChanged: number): number;

  detectImpact(
    additions: number,
    deletions: number,
    filesChanged: number,
  ): number;

  detectConsistency(commitsThisWeek: number, avgCommitSize: number): number;

  detectAntiPatterns(
    recentCommits: QualityMetricsResult[],
  ): ViolationIncident[];
}
