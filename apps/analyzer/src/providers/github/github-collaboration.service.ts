import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface PullRequestReview {
  commitSha: string;
  prNumber: number;
  reviewedAt: Date;
  commentsCount: number;
  changesRequested: boolean;
  approved: boolean;
}

export interface CodeOwnership {
  filePath: string;
  totalCommits: number;
  authorCommits: number;
  ownershipPercentage: number;
  firstTouchedAt: Date;
  lastTouchedAt: Date;
}

export interface CommitMetadata {
  sha: string;
  message: string;
  authorDate: Date;
  authorEmail: string;
  authorName: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  parentShas: string[];
}

export interface CollaborationMetrics {
  pullRequestReviews: PullRequestReview[];
  codeOwnership: Map<string, CodeOwnership>;
  commitMetadata: CommitMetadata[];
  teamSize: number;
  contributorEmails: Set<string>;
}

@Injectable()
export class GitHubCollaborationService {
  private readonly logger = new Logger(GitHubCollaborationService.name);

  async extractCollaborationMetrics(
    octokit: Octokit,
    owner: string,
    repo: string,
    commitShas: string[],
    userId: string,
    missionEvents: Array<{
      commitAuthor?: { email: string; name: string; date: string };
      summaries: Array<{
        filePath: string;
        fileStats?: { additions: number; deletions: number; changes: number };
      }>;
    }>,
  ): Promise<CollaborationMetrics> {
    const apiCallCounter = { count: 0 };

    this.logger.log(
      `Starting collaboration extraction for ${owner}/${repo} with ${commitShas.length} commits`,
    );

    const [prReviews, ownership, teamInfo] = await Promise.all([
      this.getPullRequestReviews(
        octokit,
        owner,
        repo,
        commitShas,
        userId,
        apiCallCounter,
      ),
      this.getCodeOwnershipFromEvents(userId, missionEvents),
      this.getTeamInfo(octokit, owner, repo, apiCallCounter),
    ]);

    this.logger.log(
      `Collaboration extraction complete. Total GitHub API calls: ${apiCallCounter.count}`,
    );

    return {
      pullRequestReviews: prReviews,
      codeOwnership: ownership,
      commitMetadata: [],
      teamSize: teamInfo.teamSize,
      contributorEmails: teamInfo.contributorEmails,
    };
  }

  private async getPullRequestReviews(
    octokit: Octokit,
    owner: string,
    repo: string,
    _commitShas: string[],
    _userId: string,
    apiCallCounter: { count: number },
  ): Promise<PullRequestReview[]> {
    const reviews: PullRequestReview[] = [];

    try {
      apiCallCounter.count++;
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const username = user.login;

      const { data: searchResults } =
        await octokit.rest.search.issuesAndPullRequests({
          q: `repo:${owner}/${repo} is:pr reviewed-by:${username} is:closed`,
          per_page: 100,
        });

      for (const pr of searchResults.items) {
        try {
          const { data: prReviews } = await octokit.rest.pulls.listReviews({
            owner,
            repo,
            pull_number: pr.number,
          });

          const userReviews = prReviews.filter(
            (r) => r.user?.login === username,
          );

          for (const review of userReviews) {
            if (!review.submitted_at) continue;

            reviews.push({
              commitSha: review.commit_id,
              prNumber: pr.number,
              reviewedAt: new Date(review.submitted_at),
              commentsCount: (review as { _links?: { html: { href: string } } })
                ?._links
                ? 1
                : 0,
              changesRequested: review.state === 'CHANGES_REQUESTED',
              approved: review.state === 'APPROVED',
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch reviews for PR #${pr.number}: ${(error as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to fetch PR reviews: ${error.message}`);
    }

    return reviews;
  }

  private getCodeOwnershipFromEvents(
    userId: string,
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
      const isAuthorCommit = mission.commitAuthor !== undefined;
      const commitDate = mission.commitAuthor?.date
        ? new Date(mission.commitAuthor.date)
        : new Date();

      for (const summary of mission.summaries) {
        const filePath = summary.filePath;
        const linesChanged =
          (summary.fileStats?.additions || 0) +
          (summary.fileStats?.deletions || 0);
        const existing = fileTouches.get(filePath);

        if (!existing) {
          fileTouches.set(filePath, {
            authorTouches: isAuthorCommit ? 1 : 0,
            totalTouches: 1,
            authorLinesChanged: isAuthorCommit ? linesChanged : 0,
            totalLinesChanged: linesChanged,
            dates: [commitDate],
          });
        } else {
          existing.totalTouches++;
          existing.totalLinesChanged += linesChanged;
          if (isAuthorCommit) {
            existing.authorTouches++;
            existing.authorLinesChanged += linesChanged;
          }
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
        firstTouchedAt: sortedDates[0],
        lastTouchedAt: sortedDates[sortedDates.length - 1],
      });
    }

    this.logger.log(
      `Calculated ownership for ${ownershipMap.size} files from event data (0 API calls, weighted by lines changed)`,
    );

    return ownershipMap;
  }

  private async getTeamInfo(
    octokit: Octokit,
    owner: string,
    repo: string,
    apiCallCounter: { count: number },
  ): Promise<{ teamSize: number; contributorEmails: Set<string> }> {
    try {
      apiCallCounter.count++;
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      const emails = new Set<string>();
      for (const contributor of contributors) {
        try {
          apiCallCounter.count++;
          const { data: user } = await octokit.rest.users.getByUsername({
            username: contributor.login,
          });
          if (user.email) {
            emails.add(user.email);
          }
        } catch {
          this.logger.debug(`Could not fetch email for ${contributor.login}`);
        }
      }

      return {
        teamSize: contributors.length,
        contributorEmails: emails,
      };
    } catch (error) {
      this.logger.error(`Failed to get team info: ${error.message}`);
      return { teamSize: 1, contributorEmails: new Set() };
    }
  }
}
