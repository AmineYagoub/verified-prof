import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import {
  CoreMetricsApiResponse,
  LanguageExpertise,
  MissionTimeline,
  TechnologyStackResponse,
  TechStackDNA,
  UserProfileResponse,
  WeeklyIntensity,
} from '@verified-prof/shared';

@Injectable()
export class ProfileAggregatorService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string): Promise<UserProfileResponse | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: {
          select: {
            slug: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    if (!user.userProfile?.slug) {
      return null;
    }
    return await this.getFullProfile(user.userProfile.slug);
  }

  async getFullProfile(slug: string): Promise<UserProfileResponse> {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { slug },
      include: {
        user: true,
        coreMetrics: true,
        techStackDNA: true,
        languageExpertises: {
          orderBy: { expertise: 'desc' },
          take: 10,
        },
        weeklyIntensities: {
          orderBy: { week: 'desc' },
          take: 48,
        },
        missions: {
          orderBy: { date: 'desc' },
          take: 6,
        },
        architecturalLayers: {
          orderBy: { fileCount: 'desc' },
        },
        effortDistributions: {
          orderBy: { createdAt: 'desc' },
          take: 4,
        },
        technologyStack: {
          orderBy: [{ masteryLevel: 'desc' }, { implementationScore: 'desc' }],
          where: {
            masteryLevel: { in: ['PROFICIENT', 'EXPERT', 'USED'] },
          },
        },
      },
    });
    if (!userProfile) {
      throw new NotFoundException(
        `Profile data not yet generated for user ${slug}. Run analysis first.`,
      );
    }
    return {
      userId: userProfile.user.id,
      name: userProfile.user.name || 'Anonymous',
      image: userProfile.user.image || null,
      slug: userProfile.slug || undefined,
      bio: userProfile.bio || undefined,
      lastAnalyzedAt: userProfile.lastAnalyzedAt?.toISOString(),
      coreMetrics: userProfile.coreMetrics
        ? this.mapCoreMetrics(userProfile.user.id, userProfile.coreMetrics)
        : undefined,
      techStackDNA: userProfile.techStackDNA
        ? this.mapTechStackDNA(userProfile.techStackDNA)
        : undefined,
      technologyStack:
        userProfile.technologyStack && userProfile.technologyStack.length > 0
          ? this.mapTechnologyStack(userProfile.technologyStack)
          : undefined,
      missionTimeline:
        userProfile.missions && userProfile.missions.length > 0
          ? this.mapMissionTimeline(userProfile.missions)
          : undefined,
    };
  }

  private mapCoreMetrics(
    userId: string,
    metrics: Record<string, unknown>,
  ): CoreMetricsApiResponse {
    return {
      userId,
      codeImpact: (metrics.codeImpact as number) || 0,
      cycleTime: (metrics.cycleTime as number) || 0,
      logicDensity: (metrics.logicDensity as number) || 0,
      systemComplexityScore: (metrics.systemComplexityScore as number) || 0,
      velocityPercentile: (metrics.velocityPercentile as number) || 0,
      seniorityRank:
        (metrics.seniorityRank as CoreMetricsApiResponse['seniorityRank']) ||
        'Junior',
      specialization: (metrics.specialization as string) || '',
      sTierVerificationHash: (metrics.sTierVerificationHash as string) || '',
      trend: (metrics.trend as CoreMetricsApiResponse['trend']) || 'STABLE',
      periodStart: (metrics.periodStart as Date)?.toISOString() || null,
      periodEnd: (metrics.periodEnd as Date)?.toISOString() || null,
      lastVerifiedAt: (metrics.createdAt as Date)?.toISOString() || null,
    };
  }

  private mapTechStackDNA(techStack: Record<string, unknown>): TechStackDNA {
    return {
      learningCurveTrend:
        (techStack.learningCurveTrend as
          | 'Exponential'
          | 'Steady'
          | 'Specialist') || 'Steady',
      dominantLanguages: (techStack.dominantLanguages as string[]) || [],
      languages: techStack.languageExpertises
        ? (techStack.languageExpertises as Record<string, unknown>[]).map(
            (lang) => this.mapLanguageExpertise(lang),
          )
        : [],
    };
  }

  private mapLanguageExpertise(
    lang: Record<string, unknown>,
  ): LanguageExpertise {
    return {
      name: (lang.language as string) || '',
      expertise: (lang.proficiency as number) || 0,
      daysToMastery: (lang.daysToMastery as number) || 0,
      topLibraryPatterns: (lang.topPatterns as string[]) || [],
      firstSeen:
        (lang.firstSeen as Date)?.toISOString() || new Date().toISOString(),
      lastUsed:
        (lang.lastUsed as Date)?.toISOString() || new Date().toISOString(),
      weeksActive: (lang.weeksActive as number) || 0,
      weeklyIntensity: lang.weeklyIntensities
        ? (lang.weeklyIntensities as Record<string, unknown>[]).map((w) =>
            this.mapWeeklyIntensity(w),
          )
        : [],
    };
  }

  private mapWeeklyIntensity(week: Record<string, unknown>): WeeklyIntensity {
    return {
      week: (week.week as string) || '',
      intensity: (week.intensity as number) || 0,
      complexityScore: (week.complexityScore as number) || 0,
      linesWritten: (week.linesWritten as number) || 0,
      filesModified: (week.filesModified as number) || 0,
    };
  }

  private mapMissionTimeline(
    missions: Record<string, unknown>[],
  ): MissionTimeline {
    return {
      missions: missions.map((m) => ({
        id: String(m.id),
        date: (m.date as Date)?.toISOString() || new Date().toISOString(),
        impact:
          (m.impact as 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix') ||
          'Feature',
        title: (m.title as string) || '',
        architecturalFeat: (m.architecturalFeat as string) || undefined,
        summary: (m.summary as string) || '',
        achievements: (m.achievements as string[]) || [],
        patterns: (m.patterns as string[]) || [],
        domainContext: (m.domainContext as string) || '',
        complexityAdded: 0,
        commitCount: (m.commitCount as number) || 0,
        filesChanged: 0,
        isHeroMission: (m.isHeroMission as boolean) || false,
      })),
    };
  }

  private mapTechnologyStack(
    techStack: Array<Record<string, unknown>>,
  ): TechnologyStackResponse[] {
    return techStack.map((tech) => ({
      id: (tech.id as string) || '',
      category: tech.category as TechnologyStackResponse['category'],
      name: (tech.name as string) || '',
      version: (tech.version as string) || undefined,
      masteryLevel:
        tech.masteryLevel as TechnologyStackResponse['masteryLevel'],
      implementationScore: (tech.implementationScore as number) || 0,
      usageCount: (tech.usageCount as number) || 0,
      weeksActive: (tech.weeksActive as number) || 0,
      evidenceTypes: (tech.evidenceTypes as string[]) || [],
      codePatterns: (tech.codePatterns as string[]) || [],
      configFiles: (tech.configFiles as string[]) || [],
    }));
  }

  private mapArchitecturalLayers(layers: Record<string, unknown>[]) {
    return layers.map((layer) => ({
      layer: layer.layer,
      description: layer.description,
      fileCount: layer.fileCount,
      stability: layer.stability || 0,
      ownership: layer.ownership || 0,
    }));
  }

  private mapEffortDistribution(efforts: Record<string, unknown>[]) {
    return efforts.map((effort) => ({
      week: effort.week,
      totalHours: effort.totalHours || 0,
      featuresHours: effort.featuresHours || 0,
      featuresPercentage: effort.featuresPercentage || 0,
      refactorsHours: effort.refactorsHours || 0,
      refactorsPercentage: effort.refactorsPercentage || 0,
      testsHours: effort.testsHours || 0,
      testsPercentage: effort.testsPercentage || 0,
      docsHours: effort.docsHours || 0,
      docsPercentage: effort.docsPercentage || 0,
    }));
  }
}
