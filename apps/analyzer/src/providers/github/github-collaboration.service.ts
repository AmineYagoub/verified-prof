import { Injectable } from '@nestjs/common';
import { IVcsProvider, PullRequestReview } from '@verified-prof/shared';

export interface CodeOwnership {
  filePath: string;
  totalCommits: number;
  authorCommits: number;
  ownershipPercentage: number;
  firstTouchedAt: Date;
  lastTouchedAt: Date;
}

export interface CollaborationMetrics {
  pullRequestReviews: PullRequestReview[];
  codeOwnership: Map<string, CodeOwnership>;
  teamSize: number;
}

@Injectable()
export class GitHubCollaborationService {
  async extractCollaborationMetrics(
    provider: IVcsProvider,
    owner: string,
    repo: string,
    missionEvents: Array<{
      commitAuthor?: { email: string; name: string; date: string };
      summaries: Array<{
        filePath: string;
        fileStats?: { additions: number; deletions: number; changes: number };
      }>;
    }>,
  ): Promise<CollaborationMetrics> {
    const [prReviews, ownership, teamInfo] = await Promise.all([
      provider.getCollaborationData(repo, owner),
      this.getCodeOwnershipFromEvents(missionEvents),
      provider.getContributors(repo, owner),
    ]);
    return {
      pullRequestReviews: prReviews,
      codeOwnership: ownership,
      teamSize: teamInfo.teamSize,
    };
  }

  private getCodeOwnershipFromEvents(
    missionEvents: Array<{
      commitAuthor?: { email: string; name: string; date: string };
      summaries: Array<{
        filePath: string;
        fileStats?: { additions: number; deletions: number; changes: number };
      }>;
    }>,
  ): Map<string, CodeOwnership> {
    const ownershipMap = new Map<string, CodeOwnership>();
    const fileTouches = new Map<
      string,
      {
        authorTouches: number;
        totalTouches: number;
        authorLinesChanged: number;
        totalLinesChanged: number;
        dates: Date[];
      }
    >();

    for (const mission of missionEvents) {
      if (!mission.commitAuthor?.date) {
        continue;
      }
      const commitDate = new Date(mission.commitAuthor.date);
      for (const summary of mission.summaries) {
        const filePath = summary.filePath;
        const linesChanged =
          (summary.fileStats?.additions || 0) +
          (summary.fileStats?.deletions || 0);
        const existing = fileTouches.get(filePath);

        if (!existing) {
          fileTouches.set(filePath, {
            authorTouches: 1,
            totalTouches: 1,
            authorLinesChanged: linesChanged,
            totalLinesChanged: linesChanged,
            dates: [commitDate],
          });
        } else {
          existing.totalTouches++;
          existing.totalLinesChanged += linesChanged;
          existing.authorTouches++;
          existing.authorLinesChanged += linesChanged;
          existing.dates.push(commitDate);
        }
      }
    }

    for (const [filePath, touches] of fileTouches.entries()) {
      if (touches.totalTouches === 0) continue;
      const sortedDates = touches.dates.sort(
        (a, b) => a.getTime() - b.getTime(),
      );
      const touchBasedOwnership =
        (touches.authorTouches / touches.totalTouches) * 100;
      const lineBasedOwnership =
        touches.totalLinesChanged > 0
          ? (touches.authorLinesChanged / touches.totalLinesChanged) * 100
          : touchBasedOwnership;

      const weightedOwnership = (touchBasedOwnership + lineBasedOwnership) / 2;
      ownershipMap.set(filePath, {
        filePath,
        totalCommits: touches.totalTouches,
        authorCommits: touches.authorTouches,
        ownershipPercentage: weightedOwnership,
        firstTouchedAt: sortedDates[0] ?? new Date(),
        lastTouchedAt: sortedDates[sortedDates.length - 1] ?? new Date(),
      });
    }
    return ownershipMap;
  }
}
