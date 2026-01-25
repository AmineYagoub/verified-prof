import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import {
  QualityAnalysisRequest,
  QualityMetricsResponse,
  TemporalMetricsResponse,
  TemporalMetricsQuery,
  AchievementQualityResponse,
  CommitMetricsResponse,
} from '@verified-prof/shared';
import { JobOrchestrationService } from '../jobs/services/job-orchestration.service';
import { QualityService } from './quality.service';

@Controller('quality')
export class QualityController {
  constructor(
    private readonly jobOrchestration: JobOrchestrationService,
    private readonly qualityService: QualityService,
  ) {}

  @Post('analyze')
  async analyze(
    @Session() session: UserSession,
    @Body()
    body: Partial<QualityAnalysisRequest & { plan?: 'FREE' | 'PREMIUM' }>,
  ) {
    const plan: 'FREE' | 'PREMIUM' = body.plan || 'FREE';

    await this.jobOrchestration.triggerAnalysis(session.user.id, plan);

    return {
      message: 'Analysis triggered successfully',
      userId: session.user.id,
      plan,
      instructions: 'Use GET /jobs/status/latest to track progress',
    };
  }

  @Get('metrics')
  async getMetrics(
    @Session() session: UserSession,
  ): Promise<QualityMetricsResponse | null> {
    return this.qualityService.getUserMetrics(session.user.id);
  }

  @Get('temporal')
  async getTemporalMetrics(
    @Session() session: UserSession,
    @Query() query: TemporalMetricsQuery,
  ): Promise<TemporalMetricsResponse> {
    return this.qualityService.getTemporalMetrics(
      session.user.id,
      query.window,
    );
  }

  @Get('achievement/:achievementId/explanation')
  async getAchievementExplanation(
    @Session() session: UserSession,
    @Param('achievementId') achievementId: string,
  ): Promise<AchievementQualityResponse | null> {
    return this.qualityService.getAchievementExplanation(
      session.user.id,
      achievementId,
    );
  }

  @Get('commits/:commitSha/metrics')
  async getCommitMetrics(
    @Session() session: UserSession,
    @Param('commitSha') commitSha: string,
  ): Promise<CommitMetricsResponse | null> {
    return this.qualityService.getCommitMetrics(session.user.id, commitSha);
  }
}
