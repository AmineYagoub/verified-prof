import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { VerifiedProfConfigModule } from '@verified-prof/config';
import { auth } from '@verified-prof/shared';
import { ProvidersModule } from '../providers/providers.module';
import { QualityModule } from '../quality/quality.module';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    VerifiedProfConfigModule,
    AuthModule.forRoot({ auth }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600 * 1000,
      max: 1000,
    }),
    ProvidersModule,
    QualityModule,
    AiModule,
    JobsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
