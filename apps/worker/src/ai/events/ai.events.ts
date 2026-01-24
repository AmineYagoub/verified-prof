/**
 * AI Request/Response Events
 * Event-driven architecture for AI service communication
 */

export class AchievementExtractionRequestedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly prNumber: number,
    public readonly prTitle: string,
    public readonly prDescription: string,
    public readonly metrics: {
      linesAdded: number;
      linesDeleted: number;
      filesChanged: number;
      commitsCount: number;
      reviewComments: number;
    },
  ) {}
}

export class AchievementExtractionCompletedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly achievements: Array<{
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
    }>,
  ) {}
}

export class QualityExplanationRequestedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly commitSha: string,
    public readonly metrics: {
      complexityScore: number;
      maintainabilityScore: number;
      testCoverageScore: number;
      documentationScore: number;
    },
  ) {}
}

export class QualityExplanationCompletedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly commitSha: string,
    public readonly explanation: string,
    public readonly suggestions: string[],
  ) {}
}

export class BadgeDescriptionRequestedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly badgeType: string,
    public readonly badgeId: string,
    public readonly evidence: {
      commits?: number;
      qualityScore?: number;
      achievements?: number;
      streak?: number;
      reviews?: number;
    },
  ) {}
}

export class BadgeDescriptionCompletedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly badgeType: string,
    public readonly badgeId: string,
    public readonly description: string,
  ) {}
}

export class SkillValidationRequestedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly skillName: string,
    public readonly currentLevel: string,
    public readonly evidence: Array<{
      type: string;
      description: string;
      date: string;
    }>,
  ) {}
}

export class SkillValidationCompletedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly skillName: string,
    public readonly isValid: boolean,
    public readonly suggestedLevel: string,
    public readonly reasoning: string,
  ) {}
}

export class AIRequestFailedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly requestType: string,
    public readonly error: string,
  ) {}
}
