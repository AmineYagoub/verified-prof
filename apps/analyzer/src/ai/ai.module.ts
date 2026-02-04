import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { AiService } from './ai.service';
import { GeminiService } from './gemini-client.service';
import { MissionAiService } from './mission-ai.service';
import { LeadershipAiService } from './leadership-ai.service';
import { ArchitecturalLayerAiService } from './architectural-layer-ai.service';

@Module({
  imports: [DbModule],
  providers: [
    AiService,
    GeminiService,
    MissionAiService,
    LeadershipAiService,
    ArchitecturalLayerAiService,
  ],
  exports: [AiService, LeadershipAiService],
})
export class AiModule {}
