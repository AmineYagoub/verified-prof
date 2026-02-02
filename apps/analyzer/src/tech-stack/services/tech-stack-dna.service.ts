import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  TechStackDNA,
  LanguageExpertise,
  LearningCurveTrend,
  JOB_EVENTS,
  AnalysisPersistedEvent,
} from '@verified-prof/shared';
import { TechStackCalculatorService } from './tech-stack-calculator.service';

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
      await this.generateTechStackDNA(event.userId);
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

  async generateTechStackDNA(userId: string): Promise<TechStackDNA> {
    this.logger.log(`Generating Tech Stack DNA for user ${userId}`);

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

    const analysisData = await this.prisma.client.analysisTagSummary.findMany({
      where: { userId },
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
    );

    return {
      languages: languageNames.map((name) => ({
        name,
        expertise: 0,
        daysToMastery: 0,
        topLibraryPatterns: [],
        weeklyIntensity: [],
        firstSeen: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        weeksActive: 0,
      })),
      learningCurveTrend,
      dominantLanguages,
    };
  }

  private async persistTechStackDNA(
    userProfileId: string,
    learningCurveTrend: LearningCurveTrend,
    dominantLanguages: string[],
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

    this.logger.log(
      `Persisted Tech Stack DNA: ${dominantLanguages.length} dominant languages, trend: ${learningCurveTrend}`,
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
