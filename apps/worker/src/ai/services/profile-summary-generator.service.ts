import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  AI_EVENTS,
  ProfileSummaryRequestedEvent,
  ProfileSummaryCompletedEvent,
} from '@verified-prof/shared';
import { GeminiService } from './gemini.service';
import { AiDataSanitizerService } from './ai-data-sanitizer.service';
import {
  generateBioPrompt,
  generateSkillsSummaryPrompt,
  generateQualityMetricsSummaryPrompt,
} from '../prompts';

@Injectable()
export class ProfileSummaryGeneratorService {
  private readonly logger = new Logger(ProfileSummaryGeneratorService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly sanitizer: AiDataSanitizerService,
  ) {}

  @OnEvent(AI_EVENTS.PROFILE_SUMMARY_REQUESTED)
  async handleProfileSummaryRequested(event: ProfileSummaryRequestedEvent) {
    const { userId, type } = event;

    this.logger.log(`Generating ${type} summary for user ${userId}`);

    try {
      let summary: string;

      switch (type) {
        case 'bio':
          summary = await this.generateBio(userId);
          break;
        case 'skills':
          summary = await this.generateSkillsSummary(userId);
          break;
        case 'quality':
          summary = await this.generateQualityMetricsSummary(userId);
          break;
      }

      this.eventEmitter.emit(
        AI_EVENTS.PROFILE_SUMMARY_COMPLETED,
        new ProfileSummaryCompletedEvent(userId, type, summary),
      );

      this.logger.log(`Generated ${type} summary for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate ${type} summary for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async generateBio(userId: string): Promise<string> {
    const [profile, user, achievements, commitSignals] = await Promise.all([
      this.prisma.$.userCurrentProfile.findUnique({
        where: { userId },
      }),
      this.prisma.$.user.findUnique({
        where: { id: userId },
      }),
      this.prisma.$.achievement.findMany({
        where: { userId },
        orderBy: { impact: 'desc' },
        take: 5,
      }),
      this.prisma.$.commitSignal.findMany({
        where: { snapshot: { userId } },
        include: {
          qualityMetrics: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
    ]);

    if (!user || !profile) {
      throw new Error('User not found');
    }

    const skills = await this.prisma.$.skill.findMany({
      where: { userId },
      orderBy: { level: 'desc' },
      take: 10,
    });

    const topLanguages = skills
      .filter((s) => s.category === 'LANGUAGE')
      .slice(0, 5)
      .map((s) => `${s.name} (${s.level})`)
      .join(', ');

    const topFrameworks = skills
      .filter((s) => s.category === 'FRAMEWORK')
      .slice(0, 3)
      .map((s) => s.name)
      .join(', ');

    const accountYears = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000),
    );

    const totalCommits = commitSignals.length;
    const languagesUsed = [
      ...new Set(commitSignals.flatMap((c) => c.languages)),
    ];
    const reposWorkedOn = [...new Set(commitSignals.map((c) => c.repo))];

    const qualityMetrics = commitSignals
      .map((c) => c.qualityMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null);
    const avgQuality =
      qualityMetrics.length > 0
        ? (
            qualityMetrics.reduce((sum, m) => sum + m.overallScore, 0) /
            qualityMetrics.length
          ).toFixed(0)
        : 'N/A';

    const sanitizedAchievements =
      achievements
        .slice(0, 3)
        .map((a) => this.sanitizer.sanitizeAchievementTitle(a.title))
        .join(', ') || 'None yet';

    const publicRepoCount = reposWorkedOn.filter(
      (repo) => !repo.includes('private'),
    ).length;

    const prompt = generateBioPrompt({
      topLanguages,
      topFrameworks,
      totalSkills: profile.totalSkills,
      accountYears,
      totalCommits,
      languagesUsed,
      publicRepoCount,
      avgQuality,
      badgeLevel: profile.badgeLevel,
      sanitizedAchievements,
      totalAchievements: profile.totalAchievements,
    });

    const response = await this.gemini.generateJSON<{ text: string }>(prompt, {
      type: 'object',
      properties: { text: { type: 'string' } },
    });

    return response.text.trim();
  }

  private async generateSkillsSummary(userId: string): Promise<string> {
    const skills = await this.prisma.$.skill.findMany({
      where: {
        userId,
        category: 'LANGUAGE',
      },
      orderBy: { level: 'desc' },
      take: 10,
      select: {
        name: true,
        level: true,
        category: true,
        evidenceCount: true,
        lastUsed: true,
        firstUsed: true,
        confidence: true,
      },
    });

    if (skills.length === 0) {
      return 'Skills analysis pending. Complete your first analysis to see results.';
    }

    const recentCommits = await this.prisma.$.commitSignal.findMany({
      where: { snapshot: { userId } },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });

    const languageFrequency = recentCommits.reduce(
      (acc, commit) => {
        commit.languages.forEach((lang) => {
          acc[lang] = (acc[lang] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const enrichedSkills = skills.map((skill) => {
      const usageSpanDays = Math.floor(
        (skill.lastUsed.getTime() - skill.firstUsed.getTime()) /
          (24 * 60 * 60 * 1000),
      );
      return {
        ...skill,
        recentUsage: languageFrequency[skill.name] || 0,
        daysAgo: Math.floor(
          (Date.now() - skill.lastUsed.getTime()) / (24 * 60 * 60 * 1000),
        ),
        usageSpanDays,
      };
    });

    const prompt = generateSkillsSummaryPrompt(enrichedSkills);

    const response = await this.gemini.generateJSON<{ text: string }>(prompt, {
      type: 'object',
      properties: { text: { type: 'string' } },
    });

    return response.text.trim();
  }

  private async generateQualityMetricsSummary(userId: string): Promise<string> {
    const profile = await this.prisma.$.userCurrentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new Error('User profile not found');
    }
    const commitSignals = await this.prisma.$.commitSignal.findMany({
      where: { snapshot: { userId } },
      include: {
        qualityMetrics: true,
      },
      take: 100,
    });
    const qualityMetrics = commitSignals
      .map((c) => c.qualityMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (qualityMetrics.length === 0) {
      return `${profile.badgeLevel || 'Developer'} with ${profile.totalAchievements} achievements and ${profile.totalSkills} skills. Quality analysis in progress.`;
    }

    const avgOverall = (
      qualityMetrics.reduce((s, m) => s + m.overallScore, 0) /
      qualityMetrics.length
    ).toFixed(1);
    const avgDiscipline = (
      qualityMetrics.reduce((s, m) => s + m.disciplineScore, 0) /
      qualityMetrics.length
    ).toFixed(1);
    const avgClarity = (
      qualityMetrics.reduce((s, m) => s + m.clarityScore, 0) /
      qualityMetrics.length
    ).toFixed(1);
    const avgImpact = (
      qualityMetrics.reduce((s, m) => s + m.impactScore, 0) /
      qualityMetrics.length
    ).toFixed(1);
    const avgConsistency = (
      qualityMetrics.reduce((s, m) => s + m.consistencyScore, 0) /
      qualityMetrics.length
    ).toFixed(1);

    const disciplinedPct = (
      (qualityMetrics.filter((m) => m.isDisciplined).length /
        qualityMetrics.length) *
      100
    ).toFixed(0);
    const clearPct = (
      (qualityMetrics.filter((m) => m.isClear).length / qualityMetrics.length) *
      100
    ).toFixed(0);
    const impactfulPct = (
      (qualityMetrics.filter((m) => m.isImpactful).length /
        qualityMetrics.length) *
      100
    ).toFixed(0);
    const consistentPct = (
      (qualityMetrics.filter((m) => m.isConsistent).length /
        qualityMetrics.length) *
      100
    ).toFixed(0);
    const antiPatternPct = (
      (qualityMetrics.filter((m) => m.hasAntiPatterns).length /
        qualityMetrics.length) *
      100
    ).toFixed(0);

    const avgSuspicion = (
      qualityMetrics.reduce((s, m) => s + m.suspicionScore, 0) /
      qualityMetrics.length
    ).toFixed(1);

    const prompt = generateQualityMetricsSummaryPrompt({
      avgOverall,
      avgDiscipline,
      disciplinedPct,
      avgClarity,
      clearPct,
      avgImpact,
      impactfulPct,
      avgConsistency,
      consistentPct,
      antiPatternPct,
      avgSuspicion,
      badgeLevel: profile.badgeLevel,
      qualityMetricsLength: qualityMetrics.length,
      totalAchievements: profile.totalAchievements,
      totalSkills: profile.totalSkills,
    });

    const response = await this.gemini.generateJSON<{ text: string }>(prompt, {
      type: 'object',
      properties: { text: { type: 'string' } },
    });

    return response.text.trim();
  }
}
