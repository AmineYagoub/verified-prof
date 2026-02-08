import { Body, Controller, Get, Post, Session } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OptionalAuth, UserSession } from '@thallesp/nestjs-better-auth';
import {
  AnalysisTriggeredEvent,
  AnalysisTriggerRequestDto,
  JOB_EVENTS,
} from '@verified-prof/shared';

@Controller()
export class AppController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post('trigger')
  @OptionalAuth()
  async triggerAnalysis(
    @Body() body: AnalysisTriggerRequestDto,
    @Session() session: UserSession,
  ): Promise<{ status: 'accepted' | 'rejected' }> {
    const userId = session?.user?.id ?? body.userId;
    if (!userId) {
      return { status: 'rejected' };
    }
    this.eventEmitter.emit(
      JOB_EVENTS.ANALYSIS_TRIGGERED,
      new AnalysisTriggeredEvent(body.plan, userId),
    );
    return { status: 'accepted' };
  }

  @Get('health')
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
