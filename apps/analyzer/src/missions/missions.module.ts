import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { MissionsService } from './services/missions.service';
import { MissionCalculatorService } from './services/mission-calculator.service';
import { MissionsController } from './missions.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DbModule, AiModule],
  controllers: [MissionsController],
  providers: [MissionsService, MissionCalculatorService],
  exports: [MissionsService],
})
export class MissionsModule {}
