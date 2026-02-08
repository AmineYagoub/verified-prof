import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async getProgress(@Session() session: UserSession) {
    const job = await this.progressService.getJobProgress(session.user.id);
    if (!job) {
      throw new NotFoundException('No job found for user');
    }
    return {
      id: job.id,
      userId: job.userId,
      status: job.status,
      currentStage: job.currentStage,
      progress: job.progress,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
      error: job.error,
    };
  }

  @Get(':jobId')
  async getJobById(@Param('jobId') jobId: string) {
    const job = await this.progressService.getJobById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return {
      id: job.id,
      userId: job.userId,
      status: job.status,
      currentStage: job.currentStage,
      progress: job.progress,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
      error: job.error,
    };
  }
}
