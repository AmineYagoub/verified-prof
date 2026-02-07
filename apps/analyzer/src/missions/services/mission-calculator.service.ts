import { Injectable } from '@nestjs/common';
import {
  MissionTagSummary,
  MissionData,
  MissionImpactEnum,
} from '../types/mission.types';

@Injectable()
export class MissionCalculatorService {
  calculateMissions(
    tagSummaries: MissionTagSummary[],
    weekStart: string,
  ): MissionData[] {
    const commitGroups = this.groupByCommit(tagSummaries);
    const missions: MissionData[] = [];
    for (const [, files] of commitGroups.entries()) {
      if (files.length === 0) {
        continue;
      }
      const totalComplexity = files.reduce(
        (sum, f) => sum + (f.complexity || 0),
        0,
      );
      const filesChanged = files.length;
      const date = files[0]?.createdAt || new Date();
      const commitMessage =
        files[0]?.metadata?.commitMessage || files[0]?.commitSha || '';
      const impact = this.classifyImpact(commitMessage);
      const title = this.generateTitle(commitMessage, impact);
      const summary = this.generateSummary(files);
      const achievements = this.extractAchievements(files, impact);
      const domainContext = this.extractDomain(files);
      const architecturalFeat = this.identifyArchitecturalFeat(
        files,
        totalComplexity,
      );
      const isHeroMission =
        totalComplexity > 100 || filesChanged > 10 || !!architecturalFeat;

      missions.push({
        week: weekStart,
        date,
        impact,
        title,
        architecturalFeat,
        summary,
        achievements,
        domainContext,
        complexityAdded: totalComplexity,
        commitCount: 1,
        filesChanged,
        isHeroMission,
      });
    }

    return missions;
  }

  groupByCommit(
    tagSummaries: MissionTagSummary[],
  ): Map<string, MissionTagSummary[]> {
    const groups = new Map<string, MissionTagSummary[]>();
    for (const tag of tagSummaries) {
      const key = tag.commitSha;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      const group = groups.get(key);
      if (group) {
        group.push(tag);
      }
    }
    return groups;
  }

  classifyImpact(commitMessage: string): MissionImpactEnum {
    const message = commitMessage.toLowerCase();
    if (
      message.includes('infrastructure') ||
      message.includes('ci/cd') ||
      message.includes('docker') ||
      message.includes('deploy')
    ) {
      return 'Infrastructure';
    }

    if (
      message.includes('fix') ||
      message.includes('bug') ||
      message.includes('hotfix')
    ) {
      return 'Fix';
    }

    if (
      message.includes('refactor') ||
      message.includes('cleanup') ||
      message.includes('improve')
    ) {
      return 'Refactor';
    }

    return 'Feature';
  }

  generateTitle(commitMessage: string, impact: MissionImpactEnum): string {
    const cleanMessage = commitMessage
      .replace(
        /^(feat|fix|refactor|chore|docs|style|test|perf)(\(.+?\))?:\s*/i,
        '',
      )
      .trim();

    const prefix =
      impact === 'Feature'
        ? '🚀'
        : impact === 'Fix'
          ? '🔧'
          : impact === 'Refactor'
            ? '♻️'
            : '🏗️';

    return `${prefix} ${cleanMessage.charAt(0).toUpperCase()}${cleanMessage.slice(1)}`;
  }

  generateSummary(files: MissionTagSummary[]): string {
    const fileCount = files.length;
    const totalComplexity = files.reduce(
      (sum, f) => sum + (f.complexity || 0),
      0,
    );
    const languages = new Set(
      files.map((f) => f.metadata?.language).filter(Boolean),
    );

    return `Modified ${fileCount} file${fileCount > 1 ? 's' : ''} across ${languages.size} language${languages.size > 1 ? 's' : ''} with complexity score of ${totalComplexity.toFixed(0)}`;
  }

  extractAchievements(
    files: MissionTagSummary[],
    impact: MissionImpactEnum,
  ): string[] {
    const achievements: string[] = [];
    const totalFunctions = files.reduce(
      (sum, f) => sum + (f.functions?.length || 0),
      0,
    );
    const totalClasses = files.reduce(
      (sum, f) => sum + (f.classes?.length || 0),
      0,
    );

    if (totalFunctions > 5) {
      achievements.push(`Implemented ${totalFunctions} functions`);
    }
    if (totalClasses > 2) {
      achievements.push(`Created ${totalClasses} classes`);
    }
    if (impact === 'Infrastructure') {
      achievements.push('Enhanced infrastructure');
    }

    return achievements;
  }

  extractDomain(files: MissionTagSummary[]): string {
    const paths = files.map((f) => f.filePath);
    const commonPath = this.findCommonPath(paths);

    if (commonPath.includes('api') || commonPath.includes('backend')) {
      return 'Backend';
    }
    if (
      commonPath.includes('ui') ||
      commonPath.includes('components') ||
      commonPath.includes('frontend')
    ) {
      return 'Frontend';
    }
    if (commonPath.includes('infra') || commonPath.includes('deploy')) {
      return 'DevOps';
    }
    if (commonPath.includes('test')) {
      return 'Testing';
    }

    return 'General';
  }

  findCommonPath(paths: string[]): string {
    if (paths.length === 0) return '';
    if (paths.length === 1) return paths[0];

    const parts = paths[0].split('/');
    let commonPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (paths.every((p) => p.split('/')[i] === part)) {
        commonPath += (commonPath ? '/' : '') + part;
      } else {
        break;
      }
    }

    return commonPath;
  }

  identifyArchitecturalFeat(
    files: MissionTagSummary[],
    totalComplexity: number,
  ): string | null {
    if (totalComplexity > 100) {
      return 'High complexity implementation demonstrating advanced architectural skills';
    }
    const hasMultipleLanguages =
      new Set(files.map((f) => f.metadata?.language)).size > 2;
    if (hasMultipleLanguages) {
      return 'Cross-language integration showcasing polyglot expertise';
    }
    return null;
  }
}
