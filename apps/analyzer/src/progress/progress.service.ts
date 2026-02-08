import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  JobStageProgressEvent,
  JobStage,
  JobStatus,
} from '@verified-prof/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);
  private readonly jobStore = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new job when analysis is triggered
   */
  @OnEvent(JOB_EVENTS.ANALYSIS_TRIGGERED, { async: true })
  async handleAnalysisTriggered(event: { userId: string; plan: string }) {
    const jobId = randomUUID();
    this.jobStore.set(event.userId, jobId);
    await this.prisma.client.jobTracking.create({
      data: {
        id: jobId,
        userId: event.userId,
        status: JobStatus.RUNNING,
        currentStage: JobStage.FETCHING_COMMITS,
        progress: 5,
      },
    });
  }

  /**
   * Listen to stage progress events and update database
   * Looks up jobId from userId using the jobStore
   */
  @OnEvent(JOB_EVENTS.JOB_STAGE_PROGRESS, { async: true })
  async handleJobStageProgress(event: JobStageProgressEvent) {
    const jobId = this.jobStore.get(event.userId);
    if (!jobId) {
      this.logger.warn(`No job found for user ${event.userId}`);
      return;
    }
    try {
      await this.prisma.client.jobTracking.update({
        where: { id: jobId },
        data: {
          status: event.status,
          currentStage: event.currentStage,
          progress: event.progress,
          error: event.error ?? null,
          completedAt: event.status === JobStatus.COMPLETED ? new Date() : null,
        },
      });
      if (
        event.status === JobStatus.COMPLETED ||
        event.status === JobStatus.FAILED
      ) {
        this.jobStore.delete(event.userId);
      }
    } catch (error) {
      this.logger.error(`Failed to update job progress: ${error}`, error);
    }
  }

  /**
   * Get the current job progress for a user
   */
  async getJobProgress(userId: string) {
    const job = await this.prisma.client.jobTracking.findFirst({
      where: {
        userId,
        status: {
          in: [JobStatus.QUEUED, JobStatus.RUNNING],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!job) {
      const recentJob = await this.prisma.client.jobTracking.findFirst({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return recentJob || null;
    }

    return job;
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string) {
    return this.prisma.client.jobTracking.findUnique({
      where: { id: jobId },
    });
  }

  /**
   * Get the current job ID for a user
   */
  getJobIdForUser(userId: string): string | undefined {
    return this.jobStore.get(userId);
  }
}
