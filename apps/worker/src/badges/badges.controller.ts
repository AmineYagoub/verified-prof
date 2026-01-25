import { Controller, Get, Param, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';

@Controller('badges')
export class BadgesController {
  private readonly logger = new Logger(BadgesController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('user/:userId')
  async getUserBadges(@Param('userId') userId: string) {
    this.logger.log(`Fetching badges for user ${userId}`);

    const badges = await this.prisma.client.badge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        earnedAt: true,
        criteria: true,
        evidence: true,
        verificationStatus: true,
        confidence: true,
      },
    });

    this.logger.debug(`Found ${badges.length} badges for user ${userId}`);

    return badges;
  }
}
