import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { TechStackDnaService } from './services/tech-stack-dna.service';
import { TechStackController } from './tech-stack.controller';
import { TechStackCalculatorService } from './services/tech-stack-calculator.service';

@Module({
  imports: [DbModule],
  controllers: [TechStackController],
  providers: [TechStackDnaService, TechStackCalculatorService],
  exports: [TechStackDnaService],
})
export class TechStackModule {}
