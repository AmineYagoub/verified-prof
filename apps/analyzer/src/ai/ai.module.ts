import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { AiService } from './services/ai.service';
import { GeminiService } from './services/gemini-client.service';
import { MissionAiService } from './services/mission-ai.service';
import { LeadershipAiService } from './services/leadership-ai.service';
import { ArchitecturalLayerAiService } from './services/architectural-layer-ai.service';

@Module({
  imports: [DbModule],
  providers: [
    AiService,
    GeminiService,
    MissionAiService,
    LeadershipAiService,
    ArchitecturalLayerAiService,
  ],
  exports: [AiService, GeminiService, LeadershipAiService],
})
export class AiModule {}
