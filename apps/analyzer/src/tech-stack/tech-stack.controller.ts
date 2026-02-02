import { Controller, Get, Param, Logger } from '@nestjs/common';
import { TechStackDnaService } from './services/tech-stack-dna.service';
import { TechStackDNA } from '@verified-prof/shared';

@Controller('tech-stack')
export class TechStackController {
  private readonly logger = new Logger(TechStackController.name);

  constructor(private readonly techStackDnaService: TechStackDnaService) {}

  @Get(':userId')
  async getTechStackDNA(
    @Param('userId') userId: string,
  ): Promise<TechStackDNA> {
    return this.techStackDnaService.getTechStackDNA(userId);
  }
}
