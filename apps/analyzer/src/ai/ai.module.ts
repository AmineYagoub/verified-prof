import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { AiService } from './ai.service';
import { GeminiService } from './gemini-client.service';
import { MissionAiService } from './mission-ai.service';

@Module({
  imports: [DbModule],
  providers: [AiService, GeminiService, MissionAiService],
  exports: [AiService],
})
export class AiModule {}
