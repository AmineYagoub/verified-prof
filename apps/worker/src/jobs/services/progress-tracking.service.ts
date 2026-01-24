import { Injectable, Logger } from '@nestjs/common';
import {
  InputJsonValue,
  JobProgress,
  JobStatus,
  JobType,
} from '@verified-prof/shared';
import { PrismaService } from '@verified-prof/prisma';

@Injectable()
export class ProgressTrackingService {
  private readonly logger = new Logger(ProgressTrackingService.name);
  private readonly progressCache = new Map<string, JobProgress>();

  constructor(private readonly prisma: PrismaService) {}

  async createJob(
    userId: string,
    type: JobType,
    metadata?: Record<string, unknown>,
  ): Promise<JobProgress> {
    const jobId = `${type}_${userId}_${Date.now()}`;
    const progress: JobProgress = {
      jobId,
      userId,
      type,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      metadata,
    };

    this.progressCache.set(jobId, progress);
    await this.persistProgress(progress);

    this.logger.log(`Created job ${jobId} for user ${userId}`);
    return progress;
  }

  async updateProgress(
    jobId: string,
    updates: Partial<JobProgress>,
  ): Promise<JobProgress> {
    const current = this.progressCache.get(jobId);
    if (!current) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updated: JobProgress = {
      ...current,
      ...updates,
      progress: Math.min(
        100,
        Math.max(0, updates.progress ?? current.progress),
      ),
    };

    this.progressCache.set(jobId, updated);
    await this.persistProgress(updated);

    return updated;
  }

  async completeJob(jobId: string, result?: unknown): Promise<JobProgress> {
    return this.updateProgress(jobId, {
      status: 'completed' as JobStatus,
      progress: 100,
      completedAt: new Date(),
      metadata: result ? { result } : undefined,
    });
  }

  async failJob(jobId: string, error: string): Promise<JobProgress> {
    return this.updateProgress(jobId, {
      status: 'failed',
      completedAt: new Date(),
      error,
    });
  }

  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    const cached = this.progressCache.get(jobId);
    if (cached) {
      return cached;
    }

    return this.loadProgress(jobId);
  }

  async getUserJobs(userId: string): Promise<JobProgress[]> {
    const jobs = await this.prisma.$.jobProgress.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return jobs.map(this.mapToJobProgress);
  }

  async getLatestUserJob(
    userId: string,
    type?: JobType,
  ): Promise<JobProgress | null> {
    const where: { userId: string; type?: string } = { userId };
    if (type) {
      where.type = type;
    }

    const job = await this.prisma.$.jobProgress.findFirst({
      where,
      orderBy: { startedAt: 'desc' },
    });

    return job ? this.mapToJobProgress(job) : null;
  }

  private async persistProgress(progress: JobProgress): Promise<void> {
    try {
      await this.prisma.$.jobProgress.upsert({
        where: { jobId: progress.jobId },
        create: {
          jobId: progress.jobId,
          userId: progress.userId,
          type: progress.type,
          status: progress.status,
          progress: progress.progress,
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps,
          completedSteps: progress.completedSteps,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          error: progress.error,
          metadata: progress.metadata as InputJsonValue,
        },
        update: {
          status: progress.status,
          progress: progress.progress,
          currentStep: progress.currentStep,
          completedSteps: progress.completedSteps,
          completedAt: progress.completedAt,
          error: progress.error,
          metadata: progress.metadata as InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist progress for ${progress.jobId}`,
        error,
      );
    }
  }

  private async loadProgress(jobId: string): Promise<JobProgress | null> {
    const job = await this.prisma.$.jobProgress.findUnique({
      where: { jobId },
    });

    if (!job) {
      return null;
    }

    const progress = this.mapToJobProgress(job);
    this.progressCache.set(jobId, progress);
    return progress;
  }

  private mapToJobProgress(job: {
    jobId: string;
    userId: string;
    type: string;
    status: string;
    progress: number;
    currentStep: string | null;
    totalSteps: number | null;
    completedSteps: number | null;
    startedAt: Date;
    completedAt: Date | null;
    error: string | null;
    metadata: unknown;
  }): JobProgress {
    return {
      jobId: job.jobId,
      userId: job.userId,
      type: job.type as JobType,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep || undefined,
      totalSteps: job.totalSteps || undefined,
      completedSteps: job.completedSteps || undefined,
      startedAt: job.startedAt,
      completedAt: job.completedAt || undefined,
      error: job.error || undefined,
      metadata: job.metadata as Record<string, unknown> | undefined,
    };
  }
}
