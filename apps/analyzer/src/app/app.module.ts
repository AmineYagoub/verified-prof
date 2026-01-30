import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { VerifiedProfConfigModule } from '@verified-prof/config';
import { auth } from '@verified-prof/shared';
import { ProvidersModule } from '../providers/providers.module';
import { HealthController } from './app.controller';

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
  ],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class AppModule {}
