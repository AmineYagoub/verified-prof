import { Injectable } from '@nestjs/common';
import { TagSummary, WeeklyIntensity } from '@verified-prof/shared';

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
export class TechStackCalculatorService {
  private readonly MASTERY_THRESHOLD = 0.8;
  private readonly EXPONENTIAL_GROWTH_RATE = 0.15;
  private readonly STEADY_GROWTH_RATE = 0.05;

  groupByWeekAndLanguage(
    data: Array<{ tagSummary: TagSummary; createdAt: Date; filePath: string }>,
  ): Map<string, Map<string, Array<{ summary: TagSummary; date: Date }>>> {
    const weeklyMap = new Map<
      string,
      Map<string, Array<{ summary: TagSummary; date: Date }>>
    >();

    for (const item of data) {
      const summary = item.tagSummary;
      const language = summary.metadata?.language || 'unknown';
      const week = this.getISOWeek(item.createdAt);

      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, new Map());
      }

      const langMap = weeklyMap.get(week);
      if (!langMap.has(language)) {
        langMap.set(language, []);
      }

      langMap.get(language).push({ summary, date: item.createdAt });
    }

    return weeklyMap;
  }

  calculateLanguageStats(
    weeklyData: Map<
      string,
      Map<string, Array<{ summary: TagSummary; date: Date }>>
    >,
  ): Map<string, LanguageStats> {
    const langStats = new Map<string, LanguageStats>();

    for (const [week, langMap] of weeklyData) {
      for (const [language, files] of langMap) {
        if (!langStats.has(language)) {
          langStats.set(language, {
            totalComplexity: 0,
            totalFiles: 0,
            weeklyComplexity: new Map<string, number>(),
            firstSeen: files[0].date,
            lastUsed: files[0].date,
            weeksActive: 0,
            imports: new Map<string, number>(),
          });
        }

        const stats = langStats.get(language);
        let weekComplexity = 0;

        for (const { summary, date } of files) {
          stats.totalComplexity += summary.complexity || 0;
          stats.totalFiles++;
          weekComplexity += summary.complexity || 0;

          if (date < stats.firstSeen) stats.firstSeen = date;
          if (date > stats.lastUsed) stats.lastUsed = date;

          summary.imports?.forEach((imp) => {
            const pkg = imp.split('/')[0].replace(/['"@]/g, '');
            if (pkg && pkg.length > 1) {
              stats.imports.set(pkg, (stats.imports.get(pkg) || 0) + 1);
            }
          });
        }

        stats.weeklyComplexity.set(week, weekComplexity);
        stats.weeksActive = stats.weeklyComplexity.size;
      }
    }

    return langStats;
  }

  calculateGrowthRate(weeklyComplexity: Map<string, number>): number {
    const weeks = Array.from(weeklyComplexity.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    if (weeks.length < 2) return 0;

    let totalGrowth = 0;
    for (let i = 1; i < weeks.length; i++) {
      const prev = weeks[i - 1][1];
      const curr = weeks[i][1];
      if (prev > 0) {
        totalGrowth += (curr - prev) / prev;
      }
    }

    return totalGrowth / (weeks.length - 1);
  }

  estimateDaysToMastery(currentExpertise: number, growthRate: number): number {
    if (currentExpertise >= this.MASTERY_THRESHOLD) return 0;
    if (growthRate <= 0) return 999;

    const remainingExpertise = this.MASTERY_THRESHOLD - currentExpertise;
    const weeksNeeded = remainingExpertise / (growthRate * currentExpertise);
    return Math.round(Math.min(weeksNeeded * 7, 999));
  }

  buildWeeklyIntensity(
    language: string,
    weeklyData: Map<
      string,
      Map<string, Array<{ summary: TagSummary; date: Date }>>
    >,
    totalComplexity: number,
  ): WeeklyIntensity[] {
    const result: WeeklyIntensity[] = [];

    for (const [week, langMap] of weeklyData) {
      const langFiles = langMap.get(language);
      if (!langFiles) continue;

      const weekComplexity = langFiles.reduce(
        (sum, f) => sum + (f.summary.complexity || 0),
        0,
      );
      const intensity = weekComplexity / Math.max(totalComplexity, 1);
      const linesWritten = langFiles.reduce(
        (sum, f) => sum + (f.summary.sizeBytes || 0),
        0,
      );

      result.push({
        week,
        intensity,
        complexityScore: weekComplexity,
        linesWritten: Math.round(linesWritten / 40),
        filesModified: langFiles.length,
      });
    }

    return result.sort((a, b) => a.week.localeCompare(b.week));
  }

  classifyLearningCurve(langStats: Map<string, LanguageStats>): string {
    const languages = Array.from(langStats.values());
    const avgGrowthRate =
      languages.reduce((sum, stats) => {
        const rate = this.calculateGrowthRate(stats.weeklyComplexity);
        return sum + rate;
      }, 0) / Math.max(languages.length, 1);

    if (avgGrowthRate > this.EXPONENTIAL_GROWTH_RATE) return 'Exponential';
    if (avgGrowthRate < this.STEADY_GROWTH_RATE && languages.length <= 3)
      return 'Specialist';
    return 'Steady';
  }

  getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }
}
