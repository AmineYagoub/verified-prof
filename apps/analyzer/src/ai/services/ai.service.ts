import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { JobStage, JobStatus, PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  TagSummary,
  AnalysisPersistedEvent,
  JobStageProgressEvent,
} from '@verified-prof/shared';
import { GeminiService } from './gemini-client.service';
import { generateCoreMetricsPrompt } from '../prompts/core-metrics.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly em: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    this.logger.log(`AI analysis triggered for week ${event.weekStart}`);

    if (!event.userId) {
      this.logger.warn('No userId in event, skipping AI analysis');
      return;
    }

    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        event.userId,
        JobStatus.RUNNING,
        JobStage.AI_ANALYSIS,
        66,
      ),
    );

    try {
      await this.analyzeWeeklyBatch(event.userId, event.weekStart, event);
      this.em.emit(
        JOB_EVENTS.JOB_STAGE_PROGRESS,
        new JobStageProgressEvent(
          event.userId,
          JobStatus.RUNNING,
          JobStage.AI_ANALYSIS,
          75,
        ),
      );
    } catch (error) {
      this.logger.error('Failed to analyze weekly batch', error);
    }
  }

  private analyzeWeeklyBatch = async (
    userId: string,
    weekStart: string,
    event: AnalysisPersistedEvent,
  ) => {
    if (!event.tagSummaries || event.tagSummaries.length === 0) {
      this.logger.warn('No tag summaries in event, skipping analysis');
      return;
    }
    const weeklyTags = event.tagSummaries.map(
      (t) => t.tagSummary as unknown as TagSummary,
    );
    await this.analyzeCoreMetrics(userId, weekStart, weeklyTags, event);
  };

  private analyzeCoreMetrics = async (
    userId: string,
    weekStart: string,
    weeklyTags: TagSummary[],
    event: AnalysisPersistedEvent,
  ) => {
    const prompt = generateCoreMetricsPrompt({
      weeklyTags,
      commitMessages: event.commitMetadata?.map((c) => c.message) || [],
      weekRange: weekStart,
      teamSize: event.teamSize,
      codeOwnership: event.codeOwnership,
      pullRequestReviews: event.pullRequestReviews,
      commitMetadata: event.commitMetadata,
    });
    const fullPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
    const metrics = await this.gemini.generateJSON<{
      codeImpact: number;
      cycleTime: number;
      logicDensity: number;
      systemComplexityScore: number;
      velocityPercentile: number;
      seniorityRank: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
      specialization: string;
      bio: string;
      sTierVerificationHash: string;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
    }>(fullPrompt, prompt.jsonSchema);
    await this.persistCoreMetrics(userId, metrics);
  };

  private persistCoreMetrics = async (
    userId: string,
    metrics: {
      codeImpact: number;
      cycleTime: number;
      logicDensity: number;
      systemComplexityScore: number;
      velocityPercentile: number;
      seniorityRank: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
      specialization: string;
      bio: string;
      sTierVerificationHash: string;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
    },
  ) => {
    const profile = await this.prisma.client.userProfile.upsert({
      where: { userId },
      update: {
        lastAnalyzedAt: new Date(),
        bio: metrics.bio,
      },
      create: {
        userId,
        lastAnalyzedAt: new Date(),
        bio: metrics.bio,
      },
    });

    await this.prisma.client.coreMetrics.upsert({
      where: { userProfileId: profile.id },
      update: {
        codeImpact: metrics.codeImpact,
        cycleTime: metrics.cycleTime,
        logicDensity: metrics.logicDensity,
        systemComplexityScore: metrics.systemComplexityScore,
        velocityPercentile: metrics.velocityPercentile,
        seniorityRank: metrics.seniorityRank,
        specialization: metrics.specialization,
        sTierVerificationHash: metrics.sTierVerificationHash,
        trend: metrics.trend,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
      create: {
        userProfileId: profile.id,
        codeImpact: metrics.codeImpact,
        cycleTime: metrics.cycleTime,
        logicDensity: metrics.logicDensity,
        systemComplexityScore: metrics.systemComplexityScore,
        velocityPercentile: metrics.velocityPercentile,
        seniorityRank: metrics.seniorityRank,
        specialization: metrics.specialization,
        sTierVerificationHash: metrics.sTierVerificationHash,
        trend: metrics.trend,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });

    this.logger.log(`Core metrics persisted for user ${userId}`);
  };
}
