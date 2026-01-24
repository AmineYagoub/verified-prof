import { Module, forwardRef } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { AiModule } from '../ai/ai.module';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { DisciplineCalculatorService } from './services/discipline-calculator.service';
import { ClarityAnalyzerService } from './services/clarity-analyzer.service';
import { CommitScorerService } from './services/commit-scorer.service';
import { AntiGamingDetectorService } from './services/anti-gaming-detector.service';
import { RepoAllocatorService } from './services/repo-allocator.service';
import { TestEvaluatorService } from './services/test-evaluator.service';
import { TemporalAnalyzerService } from './services/temporal-analyzer.service';
import { PersistenceService } from './services/persistence.service';
import { AchievementAnalysisService } from './services/achievement-analysis.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [ProvidersModule, AiModule, forwardRef(() => JobsModule)],
  controllers: [QualityController],
  providers: [
    QualityService,
    DisciplineCalculatorService,
    ClarityAnalyzerService,
    CommitScorerService,
    AntiGamingDetectorService,
    RepoAllocatorService,
    TestEvaluatorService,
    TemporalAnalyzerService,
    PersistenceService,
    AchievementAnalysisService,
  ],
  exports: [QualityService, AchievementAnalysisService],
})
export class QualityModule {}
