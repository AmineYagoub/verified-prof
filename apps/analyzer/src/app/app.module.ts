import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { VerifiedProfConfigModule } from '@verified-prof/config';
import { auth } from '@verified-prof/shared';
import { ProvidersModule } from '../providers/providers.module';
import { HealthController } from './app.controller';
import { WebhookModule } from '../webhooks/webhook.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PersistsModule } from '../persists/persists.module';
import { AnalyzerModule } from '../orchestration/analyzer.module';
import { AiModule } from '../ai/ai.module';
import { ProfileModule } from '../profile/profile.module';
import { TechStackModule } from '../tech-stack/tech-stack.module';
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      global: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 1 hour in seconds
      max: 1000,
    }),
    VerifiedProfConfigModule,
    AuthModule.forRoot({ auth }),
    ProvidersModule,
    WebhookModule,
    PersistsModule,
    AnalyzerModule,
    AiModule,
    ProfileModule,
    TechStackModule,
    MissionsModule,
  ],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class AppModule {}
