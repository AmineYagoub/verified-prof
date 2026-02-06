import { Module } from '@nestjs/common';
import { AnalyzerOrchestrationService } from './analyzer-orchestration.service';
import { ProvidersModule } from '../providers/providers.module';
import { AstAnalyzerService } from './ast-analyzer.service';
import { TreeSitterService } from './tree-sitter.service';
import { AstCodeDetectorService } from './ast-code-detector.service';
import { AnalyzeController } from './analyze.controller';
@Module({
  imports: [ProvidersModule],
  providers: [
    AnalyzerOrchestrationService,
    AstAnalyzerService,
    TreeSitterService,
    AstCodeDetectorService,
  ],
  controllers: [AnalyzeController],
  exports: [AstAnalyzerService, TreeSitterService, AstCodeDetectorService],
})
export class AnalyzerModule {}
