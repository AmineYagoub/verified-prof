import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { TechStackDnaService } from './services/tech-stack-dna.service';
import { TechStackController } from './tech-stack.controller';
import { TechStackCalculatorService } from './services/tech-stack-calculator.service';
import { TechDetectionService } from './services/tech-detection.service';
import { ConfigFileDetectorService } from './services/config-file-detector.service';
import { InfrastructureDetectorService } from './services/infrastructure-detector.service';
import { TechEvidenceAggregatorService } from './services/tech-evidence-aggregator.service';
import { TechStackPersisterService } from './services/tech-stack-persister.service';
import { AiModule } from '../ai/ai.module';
import { AnalyzerModule } from '../orchestration/analyzer.module';

@Module({
  imports: [DbModule, AiModule, AnalyzerModule],
  controllers: [TechStackController],
  providers: [
    TechStackDnaService,
    TechStackCalculatorService,
    TechDetectionService,
    ConfigFileDetectorService,
    InfrastructureDetectorService,
    TechEvidenceAggregatorService,
    TechStackPersisterService,
  ],
  exports: [TechStackDnaService, TechDetectionService],
})
export class TechStackModule {}
