import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { MissionsService } from './services/missions.service';
import { MissionCalculatorService } from './services/mission-calculator.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DbModule, AiModule],
  controllers: [],
  providers: [MissionsService, MissionCalculatorService],
  exports: [MissionsService],
})
export class MissionsModule {}
