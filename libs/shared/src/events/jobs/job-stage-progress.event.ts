import { JobStatus, JobStage } from '../../../../prisma/src/generated';

export class JobStageProgressEvent {
  constructor(
    public readonly userId: string,
    public readonly status: JobStatus,
    public readonly currentStage: JobStage,
    public readonly progress: number,
    public readonly error?: string,
  ) {}
}
