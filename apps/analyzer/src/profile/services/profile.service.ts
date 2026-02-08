import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  AccountCreatedEvent,
  CoreMetricsApiResponse,
  JOB_EVENTS,
  UserProfileResponse,
} from '@verified-prof/shared';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(JOB_EVENTS.ACCOUNT_CREATED, { async: true })
  async handleAccountCreated(event: AccountCreatedEvent) {
    const uniqueSlug = await this.resolveUniqueSlug(
      event.username,
      event.userId,
    );
    if (uniqueSlug) {
      await this.prisma.client.userProfile.upsert({
        where: { userId: event.userId },
        create: {
          userId: event.userId,
          slug: uniqueSlug,
        },
        update: {
          slug: uniqueSlug,
        },
      });
    }
  }

  private async resolveUniqueSlug(
    baseSlug: string,
    userId: string,
  ): Promise<string | null> {
    const existingProfile = await this.prisma.client.userProfile.findUnique({
      where: { slug: baseSlug },
    });
    if (!existingProfile) {
      return baseSlug;
    }
    if (existingProfile.userId === userId) {
      return null;
    }
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newSlug = `${baseSlug}-${randomSuffix}`;
    const slugExists = await this.prisma.client.userProfile.findUnique({
      where: { slug: newSlug },
    });
    if (slugExists) {
      return this.resolveUniqueSlug(baseSlug, userId);
    }
    return newSlug;
  }

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
    const userBySlug = await this.prisma.client.userProfile.findUnique({
      where: { slug },
      select: { user: true },
    });
    return userBySlug.user;
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
