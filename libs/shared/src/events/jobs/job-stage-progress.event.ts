export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum JobStage {
  FETCHING_COMMITS = 'FETCHING_COMMITS',
  ANALYZING_COMMITS = 'ANALYZING_COMMITS',
  PERSISTING_DATA = 'PERSISTING_DATA',
  GENERATING_MISSIONS = 'GENERATING_MISSIONS',
  AI_ANALYSIS = 'AI_ANALYSIS',
  TECH_STACK_DNA = 'TECH_STACK_DNA',
  TECH_DETECTION = 'TECH_DETECTION',
  ARCHITECTURE_LAYER = 'ARCHITECTURE_LAYER',
  EFFORT_DISTRIBUTION = 'EFFORT_DISTRIBUTION',
}

export class JobStageProgressEvent {
  constructor(
    public readonly userId: string,
    public readonly status: JobStatus,
    public readonly currentStage: JobStage,
    public readonly progress: number,
    public readonly error?: string,
  ) {}
}
