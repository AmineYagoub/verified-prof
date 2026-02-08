import { Body, Controller, Get, Post, Session } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSession } from '@thallesp/nestjs-better-auth';
import {
  AnalysisTriggeredEvent,
  AnalysisTriggerRequestDto,
  JOB_EVENTS,
} from '@verified-prof/shared';

@Controller()
export class AppController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post('trigger')
  async triggerAnalysis(
    @Body() body: AnalysisTriggerRequestDto,
    @Session() session: UserSession,
  ): Promise<{ status: 'accepted' }> {
    this.eventEmitter.emit(
      JOB_EVENTS.ANALYSIS_TRIGGERED,
      new AnalysisTriggeredEvent(body.plan, session.user.id),
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
