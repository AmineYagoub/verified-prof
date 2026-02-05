import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import {
  CoreMetricsApiResponse,
  UserProfileResponse,
} from '@verified-prof/shared';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getCoreMetrics(userId: string): Promise<CoreMetricsApiResponse> {
    const profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        coreMetrics: true,
      },
    });
    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }
    if (!profile.coreMetrics) {
      throw new NotFoundException(
        `Core metrics not yet generated for user ${userId}. Run analysis first.`,
      );
    }

    const metrics = profile.coreMetrics;

    return {
      userId,
      codeImpact: metrics.codeImpact,
      cycleTime: metrics.cycleTime,
      logicDensity: metrics.logicDensity,
      systemComplexityScore: metrics.systemComplexityScore,
      velocityPercentile: metrics.velocityPercentile,
      seniorityRank: metrics.seniorityRank,
      specialization: metrics.specialization,
      sTierVerificationHash: metrics.sTierVerificationHash,
      trend: metrics.trend,
      periodStart: metrics.periodStart?.toISOString() || null,
      periodEnd: metrics.periodEnd?.toISOString() || null,
      lastVerifiedAt: profile.lastAnalyzedAt?.toISOString() || null,
    };
  }

  async getProfileByUserId(userId: string): Promise<UserProfileResponse> {
    const profile = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    return {
      userId,
      name: profile?.name || null,
      image: profile?.image || null,
    };
  }

  async getUserBySlug(slug: string) {
    return this.prisma.client.user.findFirst({
      where: {
        OR: [{ id: slug }, { name: slug }],
      },
    });
  }

  async saveConversation(data: {
    userId: string;
    transcript: string;
    duration: number;
    startedAt: Date;
    endedAt: Date;
  }) {
    return this.prisma.client.twinConversation.create({
      data: {
        userId: data.userId,
        transcript: data.transcript,
        duration: data.duration,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
      },
    });
  }
}
