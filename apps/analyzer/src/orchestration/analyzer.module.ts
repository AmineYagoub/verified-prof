import { Module } from '@nestjs/common';
import { AnalyzerOrchestrationService } from './analyzer-orchestration.service';
import { ProvidersModule } from '../providers/providers.module';
import { AstAnalyzerService } from './ast-analyzer.service';
import { AnalyzeController } from './analyze.controller';
@Module({
  imports: [ProvidersModule],
  providers: [AnalyzerOrchestrationService, AstAnalyzerService],
  controllers: [AnalyzeController],
  exports: [],
})
export class AnalyzerModule {}
