import { Controller, Get, Param, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';

@Controller('skills')
export class SkillsController {
  private readonly logger = new Logger(SkillsController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('user/:userId')
  async getUserSkills(@Param('userId') userId: string) {
    this.logger.log(`Fetching skills for user ${userId}`);

    const skills = await this.prisma.client.skill.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        level: true,
        evidenceCount: true,
        firstUsed: true,
        lastUsed: true,
        verificationStatus: true,
        confidence: true,
      },
    });

    this.logger.debug(`Found ${skills.length} skills for user ${userId}`);

    return skills;
  }
}
