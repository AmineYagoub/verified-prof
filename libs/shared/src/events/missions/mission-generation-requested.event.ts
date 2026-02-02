export interface MissionGenerationRequestedEvent {
  userId: string;
  userProfileId: string;
  weekStart: string;
  commitContexts: Array<{
    commitSha: string;
    commitMessage: string;
    files: Array<{
      path: string;
      complexity: number;
      functions: number;
      classes: number;
      language: string;
    }>;
    totalComplexity: number;
    filesChanged: number;
    date: Date;
    commitCount: number;
    duration: number;
  }>;
}
