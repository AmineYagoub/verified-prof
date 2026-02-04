import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import { JOB_EVENTS, AnalysisPersistedEvent } from '@verified-prof/shared';
import { MissionCalculatorService } from './mission-calculator.service';

const MAX_MISSIONS_PER_REPO = 3;
const MAX_TOTAL_MISSIONS = 6;

type TagSummary = {
  id: string;
  repoFullName: string;
  commitSha: string;
  filePath: string;
  complexity: number;
  functions?: string[];
  classes?: string[];
  imports?: string[];
  metadata?: {
    language?: string;
    commitMessage?: string;
    authorDate?: string;
    decorators?: string[];
  };
  createdAt: Date;
};

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
    this.logger.log(
      `Processing missions for user ${userId}, week ${weekStart}`,
    );

    try {
      await this.generateMissions(userId, weekStart, event);
      this.logger.log(`Missions generated for user ${userId}`);
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
      this.logger.log(`No tag summaries in event for week ${weekStart}`);
      return null;
    }

    const mappedSummaries: TagSummary[] = event.tagSummaries.map((ts) => ({
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
    }));

    const repoGroups = new Map<string, TagSummary[]>();
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

    this.logger.log(`Processing ${repoGroups.size} repository/repositories`);

    let allCommitContexts: Array<{
      commitSha: string;
      commitMessage: string;
      commitMessages: string[];
      totalComplexity: number;
      filesChanged: number;
      date: Date;
      commitCount: number;
      duration: number;
      languages: string[];
      totalFunctions: number;
      totalClasses: number;
      topImports: string[];
      decorators: string[];
    }> = [];

    for (const [repo, repoSummaries] of repoGroups.entries()) {
      this.logger.log(`Processing ${repoSummaries.length} files from ${repo}`);

      const commitGroups = this.calculator.groupByCommit(repoSummaries);
      const commitContexts = this.groupCommitsByWorkSession(commitGroups);

      if (commitContexts.length === 0) {
        this.logger.log(`No work sessions found for ${repo}`);
        continue;
      }

      allCommitContexts = allCommitContexts.concat(commitContexts);
    }

    if (allCommitContexts.length === 0) {
      this.logger.log(`No missions generated for week ${weekStart}`);
      return [];
    }

    if (allCommitContexts.length > MAX_TOTAL_MISSIONS) {
      this.logger.log(
        `Limiting ${allCommitContexts.length} missions to top ${MAX_TOTAL_MISSIONS} with fair distribution`,
      );

      const missionsByRepo = new Map<string, typeof allCommitContexts>();
      for (const context of allCommitContexts) {
        const repoCommits = mappedSummaries.filter((s) =>
          context.commitSha.includes(s.commitSha),
        );
        const repo = repoCommits[0]?.repoFullName || 'unknown';

        if (!missionsByRepo.has(repo)) {
          missionsByRepo.set(repo, []);
        }
        missionsByRepo.get(repo)?.push(context);
      }

      const selectedMissions: typeof allCommitContexts = [];

      for (const [repo, missions] of missionsByRepo.entries()) {
        missions.sort((a, b) => b.totalComplexity - a.totalComplexity);
        selectedMissions.push(missions[0]);
        this.logger.log(
          `Selected 1 mission from ${repo} (${missions.length} available)`,
        );
      }

      const remainingSlots = MAX_TOTAL_MISSIONS - selectedMissions.length;
      if (remainingSlots > 0) {
        const remainingMissions = allCommitContexts
          .filter((m) => !selectedMissions.includes(m))
          .sort((a, b) => b.totalComplexity - a.totalComplexity)
          .slice(0, remainingSlots);

        selectedMissions.push(...remainingMissions);
      }

      allCommitContexts = selectedMissions;
    }

    this.logger.log(
      `Emitting mission generation request for ${allCommitContexts.length} missions across ${repoGroups.size} repos`,
    );

    this.eventEmitter.emit(JOB_EVENTS.MISSION_GENERATION_REQUESTED, {
      userId,
      userProfileId: userProfile.id,
      weekStart,
      commitContexts: allCommitContexts,
    });

    return allCommitContexts;
  }

  async getMissions(userId: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return null;
    }

    return this.prisma.client.mission.findMany({
      where: { userProfileId: userProfile.id },
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  private groupCommitsByWorkSession(commitGroups: Map<string, TagSummary[]>) {
    type CommitWithDate = {
      commitSha: string;
      commitMessage: string;
      date: Date;
      files: TagSummary[];
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

    const missionCount =
      commits.length <= 10
        ? 1
        : Math.min(MAX_MISSIONS_PER_REPO, Math.ceil(commits.length / 10));

    this.logger.log(
      `Selecting top ${missionCount} mission(s) from ${commits.length} commits based on impact`,
    );

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

      this.logger.log(
        `Splitting ${commits.length} commits into ${missionCount} missions (~${commitsPerMission} commits each)`,
      );

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

      this.logger.log(
        `Created ${selectedMissions.length} missions from top commits`,
      );
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

  private parseISOWeek(weekString: string): Date {
    const match = weekString.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
      const parsedDate = new Date(weekString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      this.logger.warn(
        `Invalid week format: ${weekString}, using current date`,
      );
      return new Date();
    }

    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);

    const jan4 = new Date(year, 0, 4);
    const daysToMonday = (jan4.getDay() + 6) % 7;
    const firstMonday = new Date(year, 0, 4 - daysToMonday + (week - 1) * 7);

    return firstMonday;
  }

  private getWeekEnd(weekStart: Date): Date {
    return new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  private calculateImpactScore(
    complexity: number,
    filesCount: number,
    commitMessage: string,
  ): number {
    let score = 0;

    score += complexity * 2;
    score += filesCount * 5;

    const message = commitMessage.toLowerCase();
    if (message.includes('feat') || message.includes('feature')) score += 20;
    if (message.includes('refactor')) score += 15;
    if (message.includes('perf') || message.includes('performance'))
      score += 15;
    if (message.includes('fix') || message.includes('bug')) score += 10;
    if (message.includes('test')) score += 5;
    if (message.includes('docs') || message.includes('documentation'))
      score += 3;

    return score;
  }
}
