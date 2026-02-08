import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import { AnalysisPersistedEvent, JOB_EVENTS } from '@verified-prof/shared';

interface CommitData {
  sha: string;
  message: string;
  date: Date;
}

interface CategoryPattern {
  category: string;
  keywords: RegExp[];
}

@Injectable()
export class EffortDistributionService {
  private readonly categoryPatterns: CategoryPattern[] = [
    {
      category: 'Feature',
      keywords: [
        /\b(add|new|implement|create|introduce|feature)\b/i,
        /\b(enhancement|improvement)\b/i,
      ],
    },
    {
      category: 'Fix',
      keywords: [
        /\b(fix|bug|issue|patch|resolve|correct)\b/i,
        /\b(hotfix|bugfix)\b/i,
      ],
    },
    {
      category: 'Refactor',
      keywords: [
        /\b(refactor|restructure|reorganize|cleanup|clean up)\b/i,
        /\b(optimize|improve structure)\b/i,
      ],
    },
    {
      category: 'Test',
      keywords: [
        /\b(test|spec|coverage|unit test|integration test)\b/i,
        /\b(e2e|end-to-end)\b/i,
      ],
    },
    {
      category: 'Documentation',
      keywords: [
        /\b(doc|documentation|readme|comment|document)\b/i,
        /\b(guide|tutorial|changelog)\b/i,
      ],
    },
    {
      category: 'Infrastructure',
      keywords: [
        /\b(infra|infrastructure|devops|ci\/cd|pipeline)\b/i,
        /\b(docker|kubernetes|deploy|deployment)\b/i,
        /\b(config|configuration|setup)\b/i,
      ],
    },
    {
      category: 'Performance',
      keywords: [
        /\b(performance|perf|optimize|optimization|speed)\b/i,
        /\b(cache|caching|lazy load)\b/i,
      ],
    },
    {
      category: 'Security',
      keywords: [
        /\b(security|secure|auth|authentication|authorization)\b/i,
        /\b(vulnerability|vuln|cve|csrf|xss)\b/i,
      ],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent): Promise<void> {
    const { userId, commitMetadata } = event;
    if (!userId || !commitMetadata || commitMetadata.length === 0) {
      return;
    }

    await this.generateAndPersist(userId, commitMetadata);
  }

  async generateAndPersist(
    userId: string,
    commitMetadata: Array<{ sha: string; message: string; authorDate: string }>,
  ): Promise<void> {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      return;
    }
    const commits = commitMetadata.map((commit) => ({
      sha: commit.sha,
      message: commit.message,
      date: new Date(commit.authorDate),
    }));
    const distributions = this.calculateDistribution(commits);
    await this.prisma.client.effortDistribution.deleteMany({
      where: { userProfileId: userProfile.id },
    });

    await this.prisma.client.effortDistribution.createMany({
      data: distributions.map((dist) => ({
        userProfileId: userProfile.id,
        weekStart: new Date(dist.weekStart).toISOString(),
        features: dist.categories.features,
        fixes: dist.categories.fixes,
        refactors: dist.categories.refactors,
        tests: dist.categories.tests,
        documentation: dist.categories.documentation,
        infrastructure: dist.categories.infrastructure,
        performance: dist.categories.performance,
        security: dist.categories.security,
      })),
    });
  }

  async get(userId: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      return [];
    }
    return this.prisma.client.effortDistribution.findMany({
      where: { userProfileId: userProfile.id },
      select: {
        weekStart: true,
        features: true,
        fixes: true,
        refactors: true,
        tests: true,
        documentation: true,
        infrastructure: true,
        performance: true,
        security: true,
      },
      orderBy: { weekStart: 'asc' },
    });
  }

  private calculateDistribution(commits: CommitData[]) {
    const weekMap = new Map<
      string,
      {
        features: number;
        fixes: number;
        refactors: number;
        tests: number;
        documentation: number;
        infrastructure: number;
        performance: number;
        security: number;
      }
    >();

    for (const commit of commits) {
      const weekKey = this.getWeekStart(commit.date);
      const category = this.categorizeCommit(commit.message);
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          features: 0,
          fixes: 0,
          refactors: 0,
          tests: 0,
          documentation: 0,
          infrastructure: 0,
          performance: 0,
          security: 0,
        });
      }

      const week = weekMap.get(weekKey);
      if (!week) continue;
      switch (category) {
        case 'Feature':
          week.features++;
          break;
        case 'Fix':
          week.fixes++;
          break;
        case 'Refactor':
          week.refactors++;
          break;
        case 'Test':
          week.tests++;
          break;
        case 'Documentation':
          week.documentation++;
          break;
        case 'Infrastructure':
          week.infrastructure++;
          break;
        case 'Performance':
          week.performance++;
          break;
        case 'Security':
          week.security++;
          break;
      }
    }

    return Array.from(weekMap.entries())
      .map(([weekStart, categories]) => ({
        weekStart,
        categories,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  private categorizeCommit(message: string): string {
    for (const pattern of this.categoryPatterns) {
      for (const keyword of pattern.keywords) {
        if (keyword.test(message)) {
          return pattern.category;
        }
      }
    }
    return 'Feature';
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }
}
