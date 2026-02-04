import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  TechStackDNA,
  LanguageExpertise,
  LearningCurveTrend,
  JOB_EVENTS,
  AnalysisPersistedEvent,
  PLAN_POLICIES,
  PlanPolicy,
} from '@verified-prof/shared';
import { TechStackCalculatorService } from './tech-stack-calculator.service';

type LanguageStats = {
  totalComplexity: number;
  totalFiles: number;
  weeklyComplexity: Map<string, number>;
  firstSeen: Date;
  lastUsed: Date;
  weeksActive: number;
  imports: Map<string, number>;
};

@Injectable()
export class TechStackDnaService {
  private readonly logger = new Logger(TechStackDnaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: TechStackCalculatorService,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    this.logger.log(
      `Tech Stack DNA generation triggered for week ${event.weekStart}`,
    );

    if (!event.userId) {
      this.logger.warn(
        'No userId in event, skipping Tech Stack DNA generation',
      );
      return;
    }

    try {
      const plan = event.plan || 'FREE';
      await this.generateTechStackDNA(event.userId, plan);
      this.logger.log(
        `Tech Stack DNA generated successfully for user ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate Tech Stack DNA for user ${event.userId}`,
        error,
      );
    }
  }

  async generateTechStackDNA(
    userId: string,
    plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE' = 'FREE',
  ): Promise<TechStackDNA> {
    this.logger.log(`Generating Tech Stack DNA for user ${userId}`);

    const policy: PlanPolicy = PLAN_POLICIES[plan] ?? PLAN_POLICIES.FREE;

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      this.logger.warn(`No profile found for user ${userId}`);
      return {
        languages: [],
        learningCurveTrend: 'Steady',
        dominantLanguages: [],
      };
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - policy.windowDays);

    const analysisData = await this.prisma.client.analysisTagSummary.findMany({
      where: {
        userId,
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        tagSummary: true,
        createdAt: true,
        filePath: true,
      },
    });

    if (analysisData.length === 0) {
      this.logger.warn(`No analysis data found for user ${userId}`);
      return {
        languages: [],
        learningCurveTrend: 'Steady',
        dominantLanguages: [],
      };
    }

    const weeklyData = this.calculator.groupByWeekAndLanguage(analysisData);
    const languageStats = this.calculator.calculateLanguageStats(weeklyData);
    const languageNames = Array.from(languageStats.keys()).sort(
      (a, b) =>
        languageStats.get(b).totalComplexity -
        languageStats.get(a).totalComplexity,
    );
    const learningCurveTrend = this.calculator.classifyLearningCurve(
      languageStats,
    ) as LearningCurveTrend;
    const dominantLanguages = languageNames.slice(0, 5);

    await this.persistTechStackDNA(
      userProfile.id,
      learningCurveTrend,
      dominantLanguages,
      languageStats,
    );

    const languages: LanguageExpertise[] = languageNames.map((name) => {
      const stats = languageStats.get(name);
      return {
        name,
        expertise: stats.totalComplexity,
        daysToMastery: Math.ceil(stats.weeksActive * 7),
        topLibraryPatterns: [],
        weeklyIntensity: [],
        firstSeen: stats.firstSeen.toISOString(),
        lastUsed: stats.lastUsed.toISOString(),
        weeksActive: stats.weeksActive,
      };
    });

    return {
      languages,
      learningCurveTrend,
      dominantLanguages,
    };
  }

  private async persistTechStackDNA(
    userProfileId: string,
    learningCurveTrend: LearningCurveTrend,
    dominantLanguages: string[],
    languageStats: Map<string, LanguageStats>,
  ) {
    await this.prisma.client.techStackDNA.upsert({
      where: { userProfileId },
      create: {
        userProfileId,
        learningCurveTrend,
        dominantLanguages,
      },
      update: {
        learningCurveTrend,
        dominantLanguages,
      },
    });

    for (const [languageName, stats] of languageStats.entries()) {
      await this.prisma.client.languageExpertise.upsert({
        where: {
          userProfileId_name: {
            userProfileId,
            name: languageName,
          },
        },
        create: {
          userProfileId,
          name: languageName,
          expertise: stats.totalComplexity,
          daysToMastery: Math.ceil(stats.weeksActive * 7),
          topLibraryPatterns: [],
          firstSeen: stats.firstSeen,
          lastUsed: stats.lastUsed,
          weeksActive: stats.weeksActive,
        },
        update: {
          expertise: stats.totalComplexity,
          daysToMastery: Math.ceil(stats.weeksActive * 7),
          lastUsed: stats.lastUsed,
          weeksActive: stats.weeksActive,
        },
      });
    }

    this.logger.log(
      `Persisted Tech Stack DNA: ${languageStats.size} languages, ${dominantLanguages.length} dominant languages, trend: ${learningCurveTrend}`,
    );
  }

  async getTechStackDNA(userId: string): Promise<TechStackDNA> {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        languageExpertises: {
          orderBy: { expertise: 'desc' },
        },
        weeklyIntensities: {
          orderBy: { week: 'asc' },
        },
        techStackDNA: true,
      },
    });

    if (!userProfile) {
      return {
        languages: [],
        learningCurveTrend: 'Steady',
        dominantLanguages: [],
      };
    }

    const languages: LanguageExpertise[] = userProfile.languageExpertises.map(
      (lang) => ({
        name: lang.name,
        expertise: lang.expertise,
        daysToMastery: lang.daysToMastery,
        topLibraryPatterns: lang.topLibraryPatterns,
        weeklyIntensity: [],
        firstSeen: lang.firstSeen.toISOString(),
        lastUsed: lang.lastUsed.toISOString(),
        weeksActive: lang.weeksActive,
      }),
    );

    const learningCurveTrend =
      userProfile.techStackDNA?.learningCurveTrend || 'Steady';
    const dominantLanguages =
      userProfile.techStackDNA?.dominantLanguages ||
      languages.slice(0, 5).map((l) => l.name);

    return {
      languages,
      learningCurveTrend,
      dominantLanguages,
    };
  }
}
