import { Controller, Get, Param } from '@nestjs/common';
import { MissionsService } from './services/missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get(':userId')
  async getMissions(@Param('userId') userId: string) {
    return this.missionsService.getMissions(userId);
  }
}
