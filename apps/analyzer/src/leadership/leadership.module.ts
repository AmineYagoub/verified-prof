import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { LeadershipService } from './services/leadership.service';
import { ArchitecturalLayerService } from './services/architectural-layer.service';
import { EffortDistributionService } from './services/effort-distribution.service';
import { LeadershipController } from './leadership.controller';

@Module({
  imports: [DbModule],
  controllers: [LeadershipController],
  providers: [
    LeadershipService,
    ArchitecturalLayerService,
    EffortDistributionService,
  ],
  exports: [LeadershipService],
})
export class LeadershipModule {}
