import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { JobOrchestrationService } from './services/job-orchestration.service';
import { ProgressTrackingService } from './services/progress-tracking.service';
import { JobType } from '@verified-prof/shared';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly orchestration: JobOrchestrationService,
    private readonly progress: ProgressTrackingService,
  ) {}

  @Post('trigger-analysis')
  async triggerAnalysis(
    @Session() session: UserSession,
    @Query('plan') plan: 'FREE' | 'PREMIUM' = 'FREE',
  ) {
    await this.orchestration.triggerAnalysis(session.user.id, plan);
    return {
      message: 'Analysis triggered successfully',
      userId: session.user.id,
      plan,
    };
  }

  @Get('status')
  async getUserJobs(@Session() session: UserSession) {
    const jobs = await this.progress.getUserJobs(session.user.id);
    return { jobs };
  }

  @Get('status/latest')
  async getLatestJob(
    @Session() session: UserSession,
    @Query('type') type?: JobType,
  ) {
    const job = await this.progress.getLatestUserJob(session.user.id, type);
    return { job };
  }

  @Get('status/:jobId')
  async getJobProgress(
    @Session() session: UserSession,
    @Param('jobId') jobId: string,
  ) {
    const job = await this.progress.getJobProgress(jobId);

    if (!job || job.userId !== session.user.id) {
      return { error: 'Job not found' };
    }

    return { job };
  }
}
