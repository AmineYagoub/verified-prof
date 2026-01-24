import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JobOrchestrationService } from './services/job-orchestration.service';
import { ProgressTrackingService } from './services/progress-tracking.service';
import { JobsController } from './jobs.controller';
import { QualityModule } from '../quality/quality.module';
import { BadgesModule } from '../badges/badges.module';
import { SkillsModule } from '../skills/skills.module';
import { DbModule } from '@verified-prof/prisma';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
    forwardRef(() => QualityModule),
    BadgesModule,
    SkillsModule,
    DbModule,
  ],
  controllers: [JobsController],
  providers: [JobOrchestrationService, ProgressTrackingService],
  exports: [JobOrchestrationService, ProgressTrackingService],
})
export class JobsModule {}
