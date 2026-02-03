import { Controller, Get, Logger, Param } from '@nestjs/common';
import { EngineeringLeadershipScore } from '@verified-prof/shared';
import { LeadershipService } from './services/leadership.service';

@Controller('leadership')
export class LeadershipController {
  private readonly logger = new Logger(LeadershipController.name);

  constructor(private readonly leadershipService: LeadershipService) {}

  @Get(':userId')
  async getEngineeringLeadership(
    @Param('userId') userId: string,
  ): Promise<EngineeringLeadershipScore> {
    return this.leadershipService.getEngineeringLeadership(userId);
  }
}
