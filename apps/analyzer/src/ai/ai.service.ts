import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  TagSummary,
  AnalysisPersistedEvent,
} from '@verified-prof/shared';
import { GeminiService } from './gemini-client.service';
import { generateCoreMetricsPrompt } from './prompts/core-metrics.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    this.logger.log(`AI analysis triggered for week ${event.weekStart}`);

    if (!event.userId) {
      this.logger.warn('No userId in event, skipping AI analysis');
      return;
    }

    try {
      await this.analyzeWeeklyBatch(event.userId, event.weekStart, event);
    } catch (error) {
      this.logger.error('Failed to analyze weekly batch', error);
    }
  }

  private analyzeWeeklyBatch = async (
    userId: string,
    weekStart: string,
    event: AnalysisPersistedEvent,
  ) => {
    this.logger.log(
      `Analyzing ${event.commitShas.length} commits for week ${weekStart}`,
    );

    const tagSummaries = await this.prisma.client.analysisTagSummary.findMany({
      where: {
        commitSha: { in: event.commitShas },
      },
      select: {
        tagSummary: true,
        filePath: true,
        commitSha: true,
      },
    });

    const weeklyTags = tagSummaries.map(
      (t) => t.tagSummary as unknown as TagSummary,
    );

    this.logger.log(`Processing ${weeklyTags.length} tag summaries`);

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

    this.logger.debug('Calling Gemini for core metrics');

    const fullPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;

    const metrics = await this.gemini.generateJSON<{
      codeImpact: number;
      cycleTime: number;
      logicDensity: number;
      systemComplexityScore: number;
      velocityPercentile: number;
      seniorityRank: 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';
      specialization: string;
      sTierVerificationHash: string;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
    }>(fullPrompt, prompt.jsonSchema);

    this.logger.log(`Core metrics generated: ${JSON.stringify(metrics)}`);

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
      sTierVerificationHash: string;
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
    },
  ) => {
    const profile = await this.prisma.client.userProfile.upsert({
      where: { userId },
      update: {
        lastAnalyzedAt: new Date(),
        analysisProgress: 20,
      },
      create: {
        userId,
        lastAnalyzedAt: new Date(),
        analysisProgress: 20,
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
