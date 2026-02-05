import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import {
  UserProfileResponse,
  CoreMetricsApiResponse,
  TechStackDNA,
  MissionTimeline,
  LanguageExpertise,
  WeeklyIntensity,
} from '@verified-prof/shared';

@Injectable()
export class ProfileAggregatorService {
  private readonly logger = new Logger(ProfileAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFullProfile(slug: string): Promise<UserProfileResponse> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        OR: [{ id: slug }, { name: slug }],
      },
    });

    if (!user) {
      throw new NotFoundException(`User profile not found: ${slug}`);
    }

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId: user.id },
      include: {
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
      },
    });

    if (!userProfile) {
      throw new NotFoundException(
        `Profile data not yet generated for user ${slug}. Run analysis first.`,
      );
    }

    return {
      userId: user.id,
      name: user.name || 'Anonymous',
      image: user.image || null,
      lastAnalyzedAt: userProfile.lastAnalyzedAt?.toISOString(),
      analysisProgress: userProfile.analysisProgress || 0,
      coreMetrics: userProfile.coreMetrics
        ? this.mapCoreMetrics(user.id, userProfile.coreMetrics)
        : undefined,
      techStackDNA: userProfile.techStackDNA
        ? this.mapTechStackDNA(userProfile.techStackDNA)
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
        week: '',
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
