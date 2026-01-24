import { Controller, Post, Body } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { QualityAnalysisRequest } from '@verified-prof/shared';
import { JobOrchestrationService } from '../jobs/services/job-orchestration.service';

@Controller('quality')
export class QualityController {
  constructor(private readonly jobOrchestration: JobOrchestrationService) {}

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
}
