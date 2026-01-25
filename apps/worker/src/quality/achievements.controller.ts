import { Controller, Get, Param, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';

@Controller('achievements')
export class AchievementsController {
  private readonly logger = new Logger(AchievementsController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string) {
    this.logger.log(`Fetching achievements for user ${userId}`);

    const achievements = await this.prisma.client.achievement.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        impact: true,
        category: true,
        skills: true,
        proofUrl: true,
        proofType: true,
        achievedAt: true,
        verificationStatus: true,
        confidence: true,
      },
    });

    this.logger.debug(
      `Found ${achievements.length} achievements for user ${userId}`,
    );

    return achievements.map((achievement) => ({
      ...achievement,
      skills: achievement.skills ? achievement.skills.split(',') : [],
    }));
  }
}
