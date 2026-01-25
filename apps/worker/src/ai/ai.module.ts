import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GeminiService } from './services/gemini.service';
import { AiOrchestrationService } from './services/ai-orchestration.service';
import { AchievementExtractorService } from './services/achievement-extractor.service';
import { QualityExplanationService } from './services/quality-explanation.service';

/**
 * AI Module
 *
 * Event-driven AI service ready for isolated deployment.
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000, // 1 hour
      max: 1000,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),
  ],
  providers: [
    GeminiService,
    AiOrchestrationService,
    AchievementExtractorService,
    QualityExplanationService,
  ],
  exports: [AiOrchestrationService],
})
export class AiModule {}
