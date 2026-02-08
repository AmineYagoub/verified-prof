import { Controller, Get, Param } from '@nestjs/common';
import { EngineeringLeadershipScore } from '@verified-prof/shared';
import { LeadershipService } from './services/leadership.service';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

@Controller('leadership')
export class LeadershipController {
  constructor(private readonly leadershipService: LeadershipService) {}

  @Get(':userId')
  @OptionalAuth()
  async getEngineeringLeadership(
    @Param('userId') userId: string,
  ): Promise<EngineeringLeadershipScore> {
    return this.leadershipService.getEngineeringLeadership(userId);
  }
}
