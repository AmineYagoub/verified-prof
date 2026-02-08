import { Module } from '@nestjs/common';
import { AnalyzerOrchestrationService } from './services/analyzer-orchestration.service';
import { ProvidersModule } from '../providers/providers.module';
import { AstAnalyzerService } from './services/ast-analyzer.service';
import { TreeSitterService } from './services/tree-sitter.service';
import { AstCodeDetectorService } from './services/ast-code-detector.service';
@Module({
  imports: [ProvidersModule],
  providers: [
    AnalyzerOrchestrationService,
    AstAnalyzerService,
    TreeSitterService,
    AstCodeDetectorService,
  ],
  controllers: [],
  exports: [AstAnalyzerService, TreeSitterService, AstCodeDetectorService],
})
export class AnalyzerModule {}
