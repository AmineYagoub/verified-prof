import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { AiService } from './ai.service';
import { GeminiService } from './gemini-client.service';

@Module({
  imports: [DbModule],
  providers: [AiService, GeminiService],
  exports: [AiService],
})
export class AiModule {}
