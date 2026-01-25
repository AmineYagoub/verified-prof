import { Module } from '@nestjs/common';
import { SkillInferenceService } from './services/skill-inference.service';
import { SkillsController } from './skills.controller';
import { AiModule } from '../ai/ai.module';
import { DbModule } from '@verified-prof/prisma';

@Module({
  imports: [AiModule, DbModule],
  controllers: [SkillsController],
  providers: [SkillInferenceService],
  exports: [SkillInferenceService],
})
export class SkillsModule {}
