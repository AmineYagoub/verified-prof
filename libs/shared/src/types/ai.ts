export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface AchievementExtractionRequest {
  userId: string;
  prNumber: number;
  prTitle: string;
  prDescription: string;
  metrics: {
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
    commitsCount: number;
    reviewComments: number;
  };
  requestId: string;
}

export interface AchievementExtractionResponse {
  requestId: string;
  userId: string;
  achievements: Array<{
    title: string;
    description: string;
    category: string;
    impact: string;
    skills: string[];
    confidence: number;
    proof?: {
      type: string;
      url: string;
      description: string;
    };
  }>;
}

export interface QualityExplanationRequest {
  userId: string;
  commitSha: string;
  metrics: {
    complexityScore: number;
    maintainabilityScore: number;
    testCoverageScore: number;
    documentationScore: number;
  };
  requestId: string;
}

export interface QualityExplanationResponse {
  requestId: string;
  userId: string;
  commitSha: string;
  explanation: string;
  suggestions: string[];
}

export interface BadgeDescriptionRequest {
  userId: string;
  badgeType: string;
  evidence: {
    commits?: number;
    qualityScore?: number;
    achievements?: number;
    streak?: number;
    reviews?: number;
  };
  requestId: string;
}

export interface BadgeDescriptionResponse {
  requestId: string;
  userId: string;
  badgeType: string;
  description: string;
}

export interface SkillValidationRequest {
  userId: string;
  skillName: string;
  currentLevel: string;
  evidence: Array<{
    type: string;
    description: string;
    date: string;
  }>;
  requestId: string;
}

export interface SkillValidationResponse {
  requestId: string;
  userId: string;
  skillName: string;
  isValid: boolean;
  suggestedLevel: string;
  reasoning: string;
}
