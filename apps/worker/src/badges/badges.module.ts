import { Module } from '@nestjs/common';
import { BadgeQualificationService } from './services/badge-qualification.service';
import { AiModule } from '../ai/ai.module';
import { DbModule } from '@verified-prof/prisma';

@Module({
  imports: [AiModule, DbModule],
  providers: [BadgeQualificationService],
  exports: [BadgeQualificationService],
})
export class BadgesModule {}
