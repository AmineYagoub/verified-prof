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
      this.getCodeOwnership(
        octokit,
        owner,
        repo,
        commitShas,
        userId,
        apiCallCounter,
      ),
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

  private async getCodeOwnership(
    octokit: Octokit,
    owner: string,
    repo: string,
    commitShas: string[],
    _userId: string,
    apiCallCounter: { count: number },
  ): Promise<Map<string, CodeOwnership>> {
    const ownershipMap = new Map<string, CodeOwnership>();

    try {
      apiCallCounter.count++;
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const username = user.login;

      for (const sha of commitShas) {
        try {
          apiCallCounter.count++;
          const { data: commit } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: sha,
          });
          const isAuthor =
            commit.commit.author?.name === username ||
            commit.author?.login === username;

          for (const file of commit.files || []) {
            const existing = ownershipMap.get(file.filename);

            if (!existing) {
              apiCallCounter.count++;
              const { data: commits } = await octokit.rest.repos.listCommits({
                owner,
                repo,
                path: file.filename,
                per_page: 100,
              });

              const authorCommits = commits.filter(
                (c) =>
                  c.commit.author?.name === username ||
                  c.author?.login === username,
              ).length;

              const firstCommit = commits[commits.length - 1];
              const lastCommit = commits[0];

              if (
                !firstCommit?.commit.author?.date ||
                !lastCommit?.commit.author?.date
              )
                continue;

              ownershipMap.set(file.filename, {
                filePath: file.filename,
                totalCommits: commits.length,
                authorCommits,
                ownershipPercentage: (authorCommits / commits.length) * 100,
                firstTouchedAt: new Date(firstCommit.commit.author.date),
                lastTouchedAt: new Date(lastCommit.commit.author.date),
              });
            } else if (isAuthor) {
              existing.authorCommits++;
              existing.ownershipPercentage =
                (existing.authorCommits / existing.totalCommits) * 100;
            }
          }
        } catch (error) {
          const status = (error as { status?: number })?.status;
          if (status === 404 || status === 422) {
            continue;
          }
          this.logger.warn(
            `Failed to calculate ownership for ${sha}: ${(error as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get code ownership: ${error.message}`);
    }

    return ownershipMap;
  }

  private async getCommitMetadata(
    octokit: Octokit,
    owner: string,
    repo: string,
    commitShas: string[],
    apiCallCounter: { count: number },
  ): Promise<CommitMetadata[]> {
    const metadata: CommitMetadata[] = [];

    for (const sha of commitShas) {
      try {
        apiCallCounter.count++;
        const { data: commit } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: sha,
        });

        if (
          !commit.commit.author?.date ||
          !commit.commit.author?.email ||
          !commit.commit.author?.name
        ) {
          continue;
        }

        metadata.push({
          sha: commit.sha,
          message: commit.commit.message,
          authorDate: new Date(commit.commit.author.date),
          authorEmail: commit.commit.author.email,
          authorName: commit.commit.author.name,
          additions: commit.stats?.additions || 0,
          deletions: commit.stats?.deletions || 0,
          filesChanged: commit.files?.length || 0,
          parentShas: commit.parents.map((p) => p.sha),
        });
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 422) {
          continue;
        }
        this.logger.warn(
          `Failed to fetch metadata for ${sha}: ${(error as Error).message}`,
        );
      }
    }

    return metadata;
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
