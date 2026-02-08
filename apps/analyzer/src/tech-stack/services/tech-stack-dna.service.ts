import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  TechStackDNA,
  LanguageExpertise,
  LearningCurveTrend,
  JOB_EVENTS,
  AnalysisPersistedEvent,
  JobStageProgressEvent,
  JobStage,
  JobStatus,
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

  private static readonly NON_PROGRAMMING_LANGUAGES = new Set([
    'json',
    'yaml',
    'yml',
    'prisma',
    'xml',
    'html',
    'css',
    'scss',
    'sass',
    'less',
    'markdown',
    'md',
    'txt',
    'toml',
    'ini',
    'conf',
    'config',
    'svg',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: TechStackCalculatorService,
    private readonly em: EventEmitter2,
  ) {}

  private isProgrammingLanguage(language: string): boolean {
    return !TechStackDnaService.NON_PROGRAMMING_LANGUAGES.has(
      language.toLowerCase(),
    );
  }

  private normalizeLanguageName(language: string): string {
    const normalized = language.toLowerCase().trim();

    const languageMap: Record<string, string> = {
      tsx: 'React',
      jsx: 'React',
      typescript: 'TypeScript',
      ts: 'TypeScript',
      javascript: 'JavaScript',
      js: 'JavaScript',
      python: 'Python',
      py: 'Python',
      go: 'Go',
      rust: 'Rust',
      rs: 'Rust',
      java: 'Java',
      kotlin: 'Kotlin',
      kt: 'Kotlin',
      swift: 'Swift',
      ruby: 'Ruby',
      rb: 'Ruby',
      php: 'PHP',
      csharp: 'C#',
      'c#': 'C#',
      cs: 'C#',
      cpp: 'C++',
      'c++': 'C++',
      c: 'C',
      scala: 'Scala',
      dart: 'Dart',
      elixir: 'Elixir',
      erlang: 'Erlang',
      haskell: 'Haskell',
      clojure: 'Clojure',
      lua: 'Lua',
      r: 'R',
      perl: 'Perl',
      zig: 'Zig',
      vue: 'Vue',
      svelte: 'Svelte',
    };

    return languageMap[normalized] || language;
  }

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

    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        event.userId,
        JobStatus.RUNNING,
        JobStage.TECH_STACK_DNA,
        55,
      ),
    );

    try {
      await this.generateTechStackDNA(event.userId, event);
      this.logger.log(
        `Tech Stack DNA generated successfully for user ${event.userId}`,
      );

      this.em.emit(
        JOB_EVENTS.JOB_STAGE_PROGRESS,
        new JobStageProgressEvent(
          event.userId,
          JobStatus.RUNNING,
          JobStage.TECH_STACK_DNA,
          60,
        ),
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
    event?: AnalysisPersistedEvent,
  ): Promise<TechStackDNA> {
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

    if (!event?.tagSummaries || event.tagSummaries.length === 0) {
      this.logger.warn(
        `No tag summaries in event for user ${userId}, skipping Tech Stack DNA generation`,
      );
      return {
        languages: [],
        learningCurveTrend: 'Steady',
        dominantLanguages: [],
      };
    }

    const analysisData = event.tagSummaries.map((ts) => ({
      tagSummary: ts.tagSummary,
      createdAt: ts.createdAt,
      filePath: ts.filePath,
    }));

    if (analysisData.length === 0) {
      this.logger.warn(`No analysis data found for user ${userId}`);
      return {
        languages: [],
        learningCurveTrend: 'Steady',
        dominantLanguages: [],
      };
    }

    const weeklyData = this.calculator.groupByWeekAndLanguage(analysisData);
    const rawLanguageStats = this.calculator.calculateLanguageStats(weeklyData);

    const languageStats = new Map<
      string,
      typeof rawLanguageStats extends Map<any, infer V> ? V : never
    >();
    for (const [rawLang, stats] of rawLanguageStats.entries()) {
      const normalizedLang = this.normalizeLanguageName(rawLang);

      if (languageStats.has(normalizedLang)) {
        const existing = languageStats.get(normalizedLang);
        existing.totalComplexity += stats.totalComplexity;
        existing.totalFiles += stats.totalFiles;
        existing.weeksActive = Math.max(
          existing.weeksActive,
          stats.weeksActive,
        );
        if (stats.firstSeen < existing.firstSeen)
          existing.firstSeen = stats.firstSeen;
        if (stats.lastUsed > existing.lastUsed)
          existing.lastUsed = stats.lastUsed;

        for (const [week, complexity] of stats.weeklyComplexity.entries()) {
          existing.weeklyComplexity.set(
            week,
            (existing.weeklyComplexity.get(week) || 0) + complexity,
          );
        }

        for (const [pkg, count] of stats.imports.entries()) {
          existing.imports.set(pkg, (existing.imports.get(pkg) || 0) + count);
        }
      } else {
        languageStats.set(normalizedLang, stats);
      }
    }

    const languageNames = Array.from(languageStats.keys()).sort(
      (a, b) =>
        languageStats.get(b).totalComplexity -
        languageStats.get(a).totalComplexity,
    );
    const learningCurveTrend = this.calculator.classifyLearningCurve(
      languageStats,
    ) as LearningCurveTrend;

    const programmingLanguagesOnly = languageNames.filter((lang) =>
      this.isProgrammingLanguage(lang),
    );

    const dominantLanguages = programmingLanguagesOnly.slice(0, 5);

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
    const existingLanguages =
      await this.prisma.client.languageExpertise.findMany({
        where: { userProfileId },
        select: { name: true },
      });
    const existingSet = new Set(existingLanguages.map((lang) => lang.name));
    const languagesArray = Array.from(languageStats.entries());
    const toCreate = languagesArray.filter(([name]) => !existingSet.has(name));
    const toUpdate = languagesArray.filter(([name]) => existingSet.has(name));
    if (toCreate.length > 0) {
      await this.prisma.client.languageExpertise.createMany({
        data: toCreate.map(([languageName, stats]) => ({
          userProfileId,
          name: languageName,
          expertise: stats.totalComplexity,
          daysToMastery: Math.ceil(stats.weeksActive * 7),
          topLibraryPatterns: [],
          firstSeen: stats.firstSeen,
          lastUsed: stats.lastUsed,
          weeksActive: stats.weeksActive,
        })),
        skipDuplicates: true,
      });
    }
    await Promise.all(
      toUpdate.map(([languageName, stats]) =>
        this.prisma.client.languageExpertise.update({
          where: {
            userProfileId_name: {
              userProfileId,
              name: languageName,
            },
          },
          data: {
            expertise: stats.totalComplexity,
            daysToMastery: Math.ceil(stats.weeksActive * 7),
            lastUsed: stats.lastUsed,
            weeksActive: stats.weeksActive,
          },
        }),
      ),
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
        name: this.normalizeLanguageName(lang.name),
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
      userProfile.techStackDNA?.dominantLanguages?.map((lang) =>
        this.normalizeLanguageName(lang),
      ) ||
      languages
        .filter((l) => this.isProgrammingLanguage(l.name))
        .slice(0, 5)
        .map((l) => l.name);

    return {
      languages,
      learningCurveTrend,
      dominantLanguages,
    };
  }
}
