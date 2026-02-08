import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { JobStage, JobStatus, PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  AnalysisPersistedEvent,
  JobStageProgressEvent,
} from '@verified-prof/shared';
import { MissionCalculatorService } from './mission-calculator.service';
import { CommitContext, MissionTagSummary } from '../types/mission.types';

const MAX_MISSIONS_PER_REPO = 3;
const MAX_TOTAL_MISSIONS = 6;

// Impact score calculation constants
const COMPLEXITY_MULTIPLIER = 2;
const FILES_COUNT_MULTIPLIER = 5;
const FEAT_BONUS = 20;
const REFACTOR_BONUS = 15;
const PERF_BONUS = 15;
const FIX_BONUS = 10;
const TEST_BONUS = 5;
const DOCS_BONUS = 3;

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: MissionCalculatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED)
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    const { userId, weekStart } = event;

    this.eventEmitter.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        userId,
        JobStatus.RUNNING,
        JobStage.GENERATING_MISSIONS,
        45,
      ),
    );

    try {
      await this.generateMissions(userId, weekStart, event);
    } catch (error) {
      this.logger.error(
        `Failed to generate missions for user ${userId}:`,
        error,
      );
    }
  }

  async generateMissions(
    userId: string,
    weekStart: string,
    event: AnalysisPersistedEvent,
  ) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      this.logger.warn(`No profile found for user ${userId}`);
      return null;
    }
    if (!event.tagSummaries || event.tagSummaries.length === 0) {
      return null;
    }

    const mappedSummaries: MissionTagSummary[] = event.tagSummaries.map(
      (ts) => ({
        id: ts.id,
        repoFullName: ts.repoFullName || 'unknown/unknown',
        commitSha: ts.commitSha,
        filePath: ts.filePath,
        complexity: (ts.tagSummary as { complexity?: number })?.complexity || 0,
        functions: (ts.tagSummary as { functions?: string[] })?.functions || [],
        classes: (ts.tagSummary as { classes?: string[] })?.classes || [],
        imports: (ts.tagSummary as { imports?: string[] })?.imports || [],
        metadata: {
          ...((
            ts.tagSummary as {
              metadata?: {
                language?: string;
                commitMessage?: string;
                authorDate?: string;
                decorators?: string[];
              };
            }
          )?.metadata || {}),
        },
        createdAt: ts.createdAt,
      }),
    );

    const repoGroups = new Map<string, MissionTagSummary[]>();
    for (const summary of mappedSummaries) {
      const repo = summary.repoFullName;
      if (!repoGroups.has(repo)) {
        repoGroups.set(repo, []);
      }
      const group = repoGroups.get(repo);
      if (group) {
        group.push(summary);
      }
    }
    let allCommitContexts: CommitContext[] = [];
    for (const [, repoSummaries] of repoGroups.entries()) {
      const commitGroups = this.calculator.groupByCommit(repoSummaries);
      const commitContexts = this.groupCommitsByWorkSession(commitGroups);
      if (commitContexts.length === 0) {
        continue;
      }
      allCommitContexts = allCommitContexts.concat(commitContexts);
    }
    if (allCommitContexts.length === 0) {
      return [];
    }
    if (allCommitContexts.length > MAX_TOTAL_MISSIONS) {
      const commitToRepoMap = new Map<string, string>();
      for (const summary of mappedSummaries) {
        commitToRepoMap.set(summary.commitSha, summary.repoFullName);
      }
      const missionsByRepo = new Map<string, CommitContext[]>();
      for (const context of allCommitContexts) {
        const firstSha = context.commitSha.split(',')[0];
        const repo = commitToRepoMap.get(firstSha) || 'unknown';
        if (!missionsByRepo.has(repo)) {
          missionsByRepo.set(repo, []);
        }
        missionsByRepo.get(repo)?.push(context);
      }

      const selectedMissions: CommitContext[] = [];
      for (const [, missions] of missionsByRepo.entries()) {
        missions.sort((a, b) => b.totalComplexity - a.totalComplexity);
        selectedMissions.push(missions[0]);
      }
      const remainingSlots = MAX_TOTAL_MISSIONS - selectedMissions.length;
      if (remainingSlots > 0) {
        const selectedSet = new Set(selectedMissions);
        const remainingMissions = allCommitContexts
          .filter((m) => !selectedSet.has(m))
          .sort((a, b) => b.totalComplexity - a.totalComplexity)
          .slice(0, remainingSlots);
        selectedMissions.push(...remainingMissions);
      }
      allCommitContexts = selectedMissions;
    }

    try {
      this.eventEmitter.emit(JOB_EVENTS.MISSION_GENERATION_REQUESTED, {
        userId,
        userProfileId: userProfile.id,
        weekStart,
        commitContexts: allCommitContexts,
      });
    } catch (error) {
      this.logger.error(`Failed to emit mission generation event:`, error);
    }
    return allCommitContexts;
  }

  async getMissions(userId: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      return []; // Return empty array instead of null for consistency
    }
    return this.prisma.client.mission.findMany({
      where: { userProfileId: userProfile.id },
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  private groupCommitsByWorkSession(
    commitGroups: Map<string, MissionTagSummary[]>,
  ) {
    type CommitWithDate = {
      commitSha: string;
      commitMessage: string;
      date: Date;
      files: MissionTagSummary[];
      totalComplexity: number;
      impactScore: number;
    };

    const commits: CommitWithDate[] = Array.from(commitGroups.entries()).map(
      ([commitSha, files]) => {
        const firstFile = files[0];
        const commitDate = firstFile?.metadata?.authorDate
          ? new Date(firstFile.metadata.authorDate)
          : firstFile?.createdAt || new Date();
        const commitMessage = firstFile?.metadata?.commitMessage || commitSha;
        const totalComplexity = files.reduce((sum, f) => sum + f.complexity, 0);
        const impactScore = this.calculateImpactScore(
          totalComplexity,
          files.length,
          commitMessage,
        );
        return {
          commitSha,
          commitMessage,
          date: commitDate,
          files,
          totalComplexity,
          impactScore,
        };
      },
    );

    commits.sort((a, b) => b.impactScore - a.impactScore);
    // Use < 10 instead of <= 10 for consistent behavior at boundary
    // 10 commits = 1 mission, 11+ commits = multiple missions
    const missionCount =
      commits.length < 10
        ? 1
        : Math.min(MAX_MISSIONS_PER_REPO, Math.ceil(commits.length / 10));
    const selectedMissions: Array<{
      commits: CommitWithDate[];
      startDate: Date;
      endDate: Date;
    }> = [];

    if (missionCount === 1) {
      selectedMissions.push({
        commits: commits.slice(0, Math.min(10, commits.length)),
        startDate: commits[commits.length - 1]?.date || new Date(),
        endDate: commits[0]?.date || new Date(),
      });
    } else {
      const commitsPerMission = Math.ceil(commits.length / missionCount);
      for (let i = 0; i < missionCount; i++) {
        const start = i * commitsPerMission;
        const end = Math.min(start + commitsPerMission, commits.length);
        const missionCommits = commits.slice(start, end);

        if (missionCommits.length > 0) {
          const sortedByDate = [...missionCommits].sort(
            (a, b) => a.date.getTime() - b.date.getTime(),
          );
          selectedMissions.push({
            commits: missionCommits,
            startDate: sortedByDate[0].date,
            endDate: sortedByDate[sortedByDate.length - 1].date,
          });
        }
      }
    }

    return selectedMissions.map((mission) => {
      const allFiles = mission.commits.flatMap((c) => c.files);
      const uniqueFiles = Array.from(
        new Map(allFiles.map((f) => [f.filePath, f])).values(),
      );
      const commitMessages = mission.commits
        .map((c) => c.commitMessage)
        .join(' → ');
      const individualCommitMessages = mission.commits.map(
        (c) => c.commitMessage,
      );
      const languages = [
        ...new Set(uniqueFiles.map((f) => f.metadata?.language || 'unknown')),
      ];
      const totalFunctions = uniqueFiles.reduce(
        (sum, f) => sum + (f.functions?.length || 0),
        0,
      );
      const totalClasses = uniqueFiles.reduce(
        (sum, f) => sum + (f.classes?.length || 0),
        0,
      );

      const allImports = uniqueFiles.flatMap((f) => f.imports || []);
      const importCounts = allImports.reduce(
        (acc, imp) => {
          if (!imp || typeof imp !== 'string') return acc;
          const pkg = imp.split('/')[0].replace(/['"`@]/g, '');
          if (pkg && pkg.length > 1) {
            acc[pkg] = (acc[pkg] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );
      const topImports = Object.entries(importCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([pkg]) => pkg);

      const allDecorators = uniqueFiles.flatMap(
        (f) => f.metadata?.decorators || [],
      );
      const uniqueDecorators = [...new Set(allDecorators)].slice(0, 10);

      return {
        commitSha: mission.commits.map((c) => c.commitSha).join(','),
        commitMessage: commitMessages,
        commitMessages: individualCommitMessages,
        totalComplexity: mission.commits.reduce(
          (sum, c) => sum + c.totalComplexity,
          0,
        ),
        filesChanged: uniqueFiles.length,
        date: mission.startDate,
        commitCount: mission.commits.length,
        duration: mission.endDate.getTime() - mission.startDate.getTime(),
        languages,
        totalFunctions,
        totalClasses,
        topImports,
        decorators: uniqueDecorators,
      };
    });
  }

  private calculateImpactScore(
    complexity: number,
    filesCount: number,
    commitMessage: string,
  ): number {
    let score = 0;
    score += complexity * COMPLEXITY_MULTIPLIER;
    score += filesCount * FILES_COUNT_MULTIPLIER;
    const message = commitMessage.toLowerCase();
    if (message.includes('feat') || message.includes('feature'))
      score += FEAT_BONUS;
    if (message.includes('refactor')) score += REFACTOR_BONUS;
    if (message.includes('perf') || message.includes('performance'))
      score += PERF_BONUS;
    if (message.includes('fix') || message.includes('bug')) score += FIX_BONUS;
    if (message.includes('test')) score += TEST_BONUS;
    if (message.includes('docs') || message.includes('documentation'))
      score += DOCS_BONUS;
    return score;
  }
}
