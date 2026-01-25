import { Injectable, Logger } from '@nestjs/common';
import { InputJsonValue, JobStatus, JobType } from '@verified-prof/shared';
import { PrismaService } from '@verified-prof/prisma';

// Local interface for job progress tracking (replacing deleted Prisma model)
export interface JobProgress {
  jobId: string;
  userId: string;
  type: string;
  status: string;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

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
    // Use AnalysisJob instead of deleted JobProgress model
    const jobs = await this.prisma.client.analysisJob.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return jobs.map((job) => this.mapAnalysisJobToProgress(job));
  }

  async getLatestUserJob(
    userId: string,
    type?: JobType,
  ): Promise<JobProgress | null> {
    // Use AnalysisJob instead of deleted JobProgress model
    const job = await this.prisma.client.analysisJob.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    return job ? this.mapAnalysisJobToProgress(job) : null;
  }

  private async persistProgress(progress: JobProgress): Promise<void> {
    try {
      // Store in cache only - use AnalysisJob for database persistence
      this.progressCache.set(progress.jobId, progress);

      // Optionally sync to AnalysisJob if needed
      // For now, AnalysisJob is primary source of truth
    } catch (error) {
      this.logger.error(
        `Failed to persist progress for ${progress.jobId}`,
        error,
      );
    }
  }

  private async loadProgress(jobId: string): Promise<JobProgress | null> {
    // Use AnalysisJob instead of deleted JobProgress model
    const job = await this.prisma.client.analysisJob.findFirst({
      where: { id: jobId },
    });

    if (!job) {
      return null;
    }

    const progress = this.mapAnalysisJobToProgress(job);
    this.progressCache.set(jobId, progress);
    return progress;
  }

  private mapAnalysisJobToProgress(job: {
    id: string;
    userId: string;
    status: string;
    progress: number;
    currentStep: string | null;
    errorMessage: string | null;
    startedAt: Date;
    completedAt: Date | null;
  }): JobProgress {
    return {
      jobId: job.id,
      userId: job.userId,
      type: 'analysis', // Default type for AnalysisJob
      status: job.status.toLowerCase(),
      progress: job.progress,
      currentStep: job.currentStep || undefined,
      startedAt: job.startedAt,
      completedAt: job.completedAt || undefined,
      error: job.errorMessage || undefined,
    };
  }
}
