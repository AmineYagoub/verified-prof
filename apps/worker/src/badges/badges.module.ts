import { Module } from '@nestjs/common';
import { BadgeQualificationService } from './services/badge-qualification.service';
import { BadgesController } from './badges.controller';
import { AiModule } from '../ai/ai.module';
import { DbModule } from '@verified-prof/prisma';

@Module({
  imports: [AiModule, DbModule],
  controllers: [BadgesController],
  providers: [BadgeQualificationService],
  exports: [BadgeQualificationService],
})
export class BadgesModule {}
