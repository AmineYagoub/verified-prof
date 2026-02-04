export interface MissionGenerationRequestedEvent {
  userId: string;
  userProfileId: string;
  weekStart: string;
  commitContexts: Array<{
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
  }>;
}
