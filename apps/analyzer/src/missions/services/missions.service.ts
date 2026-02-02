import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import { JOB_EVENTS, AnalysisPersistedEvent } from '@verified-prof/shared';
import { MissionCalculatorService } from './mission-calculator.service';

type TagSummary = {
  id: string;
  commitSha: string;
  filePath: string;
  complexity: number;
  functions?: string[];
  classes?: string[];
  metadata?: {
    language?: string;
    commitMessage?: string;
    authorDate?: string;
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
      await this.generateMissions(userId, weekStart);
      this.logger.log(`Missions generated for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate missions for user ${userId}:`,
        error,
      );
    }
  }

  async generateMissions(userId: string, weekStart: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      this.logger.warn(`No profile found for user ${userId}`);
      return null;
    }

    const weekStartDate = this.parseISOWeek(weekStart);
    const weekEndDate = this.getWeekEnd(weekStartDate);

    const tagSummaries = await this.prisma.client.analysisTagSummary.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStartDate,
          lt: weekEndDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (tagSummaries.length === 0) {
      this.logger.log(`No tag summaries found for week ${weekStart}`);
      return null;
    }

    const mappedSummaries: TagSummary[] = tagSummaries.map((ts) => ({
      id: ts.id,
      commitSha: ts.commitSha,
      filePath: ts.filePath,
      complexity: (ts.tagSummary as { complexity?: number })?.complexity || 0,
      functions: (ts.tagSummary as { functions?: string[] })?.functions || [],
      classes: (ts.tagSummary as { classes?: string[] })?.classes || [],
      metadata: (
        ts.tagSummary as {
          metadata?: {
            language?: string;
            commitMessage?: string;
            authorDate?: string;
          };
        }
      )?.metadata,
      createdAt: ts.createdAt,
    }));

    const commitGroups = this.calculator.groupByCommit(mappedSummaries);

    const commitContexts = this.groupCommitsByWorkSession(
      commitGroups,
      8 * 60 * 60 * 1000,
      4,
    );

    if (commitContexts.length === 0) {
      this.logger.log(`No work sessions found for week ${weekStart}`);
      return [];
    }

    this.logger.log(
      `Emitting mission generation request for ${commitContexts.length} work sessions`,
    );

    this.eventEmitter.emit(JOB_EVENTS.MISSION_GENERATION_REQUESTED, {
      userId,
      userProfileId: userProfile.id,
      weekStart,
      commitContexts,
    });

    return commitContexts;
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

  private groupCommitsByWorkSession(
    commitGroups: Map<string, TagSummary[]>,
    timeWindowMs: number,
    minCommits: number,
  ) {
    type CommitWithDate = {
      commitSha: string;
      commitMessage: string;
      date: Date;
      files: TagSummary[];
      totalComplexity: number;
    };

    const commits: CommitWithDate[] = Array.from(commitGroups.entries()).map(
      ([commitSha, files]) => {
        const firstFile = files[0];
        const commitDate = firstFile?.metadata?.authorDate
          ? new Date(firstFile.metadata.authorDate)
          : firstFile?.createdAt || new Date();
        const commitMessage = firstFile?.metadata?.commitMessage || commitSha;
        const totalComplexity = files.reduce((sum, f) => sum + f.complexity, 0);

        return {
          commitSha,
          commitMessage,
          date: commitDate,
          files,
          totalComplexity,
        };
      },
    );

    commits.sort((a, b) => a.date.getTime() - b.date.getTime());

    const workSessions: Array<{
      commits: CommitWithDate[];
      startDate: Date;
      endDate: Date;
    }> = [];

    let currentSession: CommitWithDate[] = [];

    for (const commit of commits) {
      if (currentSession.length === 0) {
        currentSession.push(commit);
        continue;
      }

      const lastCommit = currentSession[currentSession.length - 1];
      const timeDiff = commit.date.getTime() - lastCommit.date.getTime();

      if (timeDiff <= timeWindowMs) {
        currentSession.push(commit);
      } else {
        if (currentSession.length >= minCommits) {
          workSessions.push({
            commits: currentSession,
            startDate: currentSession[0].date,
            endDate: currentSession[currentSession.length - 1].date,
          });
        }
        currentSession = [commit];
      }
    }

    if (currentSession.length >= minCommits) {
      workSessions.push({
        commits: currentSession,
        startDate: currentSession[0].date,
        endDate: currentSession[currentSession.length - 1].date,
      });
    }

    this.logger.log(
      `Grouped ${commits.length} commits into ${workSessions.length} work sessions (min ${minCommits} commits, ${timeWindowMs / (60 * 60 * 1000)}h window)`,
    );

    return workSessions.map((session) => {
      const allFiles = session.commits.flatMap((c) => c.files);
      const uniqueFiles = Array.from(
        new Map(allFiles.map((f) => [f.filePath, f])).values(),
      );
      const commitMessages = session.commits
        .map((c) => c.commitMessage)
        .join(' → ');

      return {
        commitSha: session.commits.map((c) => c.commitSha).join(','),
        commitMessage: commitMessages,
        files: uniqueFiles.slice(0, 20).map((f) => ({
          path: f.filePath,
          complexity: f.complexity,
          functions: f.functions?.length || 0,
          classes: f.classes?.length || 0,
          language: f.metadata?.language || 'unknown',
        })),
        totalComplexity: session.commits.reduce(
          (sum, c) => sum + c.totalComplexity,
          0,
        ),
        filesChanged: uniqueFiles.length,
        date: session.startDate,
        commitCount: session.commits.length,
        duration: session.endDate.getTime() - session.startDate.getTime(),
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
}
