import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import {
  ChangedFile,
  CommitData,
  IVcsProvider,
  ListCommitsOptions,
  PullRequestData,
  RepositoryData,
  VcsProviderType,
} from '@verified-prof/shared';

type GitHubCommit = Awaited<
  ReturnType<Octokit['rest']['repos']['getCommit']>
>['data'];
type GitHubRepositoryDetails = Awaited<
  ReturnType<Octokit['rest']['repos']['get']>
>['data'];
type GitHubRepositoryListItem = Awaited<
  ReturnType<Octokit['rest']['repos']['listForUser']>
>['data'][number];
type GitHubRepository = GitHubRepositoryDetails | GitHubRepositoryListItem;
type GitHubPullRequestDetail = Awaited<
  ReturnType<Octokit['rest']['pulls']['get']>
>['data'];
type GitHubPullRequestSummary = Awaited<
  ReturnType<Octokit['rest']['pulls']['list']>
>['data'][number];
type GitHubPullRequest = GitHubPullRequestDetail | GitHubPullRequestSummary;
type GitHubFile = GitHubCommit['files'][number];

@Injectable()
export class GitHubVcsProvider implements IVcsProvider {
  private readonly logger = new Logger(GitHubVcsProvider.name);
  private octokit!: Octokit;

  initialize(token: string): void {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  getProviderType(): VcsProviderType {
    return VcsProviderType.GITHUB;
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.octokit.rest.users.getAuthenticated();
      this.logger.log(`Authenticated as ${response.data.login}`);
    } catch (error) {
      this.logger.error('Failed to authenticate with GitHub', error);
      throw new Error('GitHub authentication failed');
    }
  }

  async getCommit(
    owner: string,
    repo: string,
    sha: string,
  ): Promise<CommitData> {
    try {
      const response = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      return this.mapGitHubCommitToCommitData(response.data);
    } catch (error) {
      this.logger.error(`Failed to get commit ${sha}`, error);
      throw error;
    }
  }

  async listCommits(
    owner: string,
    repo: string,
    options?: ListCommitsOptions,
  ): Promise<CommitData[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since: options?.since?.toISOString(),
        until: options?.until?.toISOString(),
        sha: options?.branch || undefined,
        author: options?.author,
        path: options?.path,
        per_page: options?.perPage || 30,
        page: options?.page || 1,
      });

      return response.data.map((commit) =>
        this.mapGitHubCommitToCommitData(commit),
      );
    } catch (error) {
      this.logger.error('Failed to list commits', error);
      throw error;
    }
  }

  async getUserRepositories(
    username: string,
    options?: { perPage?: number; page?: number },
  ): Promise<RepositoryData[]> {
    try {
      const repos = await this.octokit.rest.repos.listForAuthenticatedUser({
        per_page: options?.perPage || 30,
        page: options?.page || 1,
        affiliation: 'owner,collaborator,organization_member',
        sort: 'updated',
      });
      return repos.data.map((repo: GitHubRepositoryListItem) =>
        this.mapGitHubRepoToRepositoryData(repo),
      );
    } catch (error) {
      this.logger.error(`Failed to list repositories for ${username}`, error);
      throw error;
    }
  }

  async listPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
      page?: number;
    },
  ): Promise<PullRequestData[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: options?.state || 'all',
        per_page: options?.perPage || 30,
        page: options?.page || 1,
      });

      return response.data.map((pr) =>
        this.mapGitHubPullRequestToPullRequestData(pr),
      );
    } catch (error) {
      this.logger.error('Failed to list pull requests', error);
      throw error;
    }
  }

  async getPullRequestCommits(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<CommitData[]> {
    try {
      const response = await this.octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });

      return response.data.map((commit) =>
        this.mapGitHubCommitToCommitData(commit),
      );
    } catch (error) {
      this.logger.error(
        `Failed to list commits in PR ${owner}/${repo}#${prNumber}`,
        error,
      );
      throw error;
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: ref || undefined,
      });

      if (Array.isArray(response.data)) {
        throw new Error('Path is a directory, not a file');
      }

      if ('content' in response.data) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      throw new Error('Unable to decode file content');
    } catch (error) {
      this.logger.error(`Failed to get file ${path}`, error);
      throw error;
    }
  }

  async getRepositoryLanguages(
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    try {
      const response = await this.octokit.rest.repos.listLanguages({
        owner,
        repo,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get languages for ${owner}/${repo}`, error);
      return {};
    }
  }

  async getRateLimit(): Promise<{
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  }> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      const coreLimit = response.data.resources.core;

      return {
        limit: coreLimit.limit,
        used: coreLimit.used,
        remaining: coreLimit.remaining,
        resetAt: new Date(coreLimit.reset * 1000),
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit', error);
      throw error;
    }
  }

  private mapGitHubCommitToCommitData(ghCommit: GitHubCommit): CommitData {
    return {
      sha: ghCommit.sha,
      htmlUrl: ghCommit.html_url,
      authorUrl: ghCommit.author?.html_url,
      authorName: ghCommit.commit.author.name,
      authorEmail: ghCommit.commit.author.email,
      authorAvatar: ghCommit.author?.avatar_url,
      authorUsername: ghCommit.author?.login,
      message: ghCommit.commit.message,
      body: ghCommit.commit.message.split('\n').slice(1).join('\n'),
      committerDate: new Date(ghCommit.commit.committer.date),
      authorDate: new Date(ghCommit.commit.author.date),
      filesChanged: ghCommit.files?.length || 0,
      additions: ghCommit.stats?.additions || 0,
      deletions: ghCommit.stats?.deletions || 0,
      changedFiles: (ghCommit.files || []).map((file: GitHubFile) =>
        this.mapGitHubFileToChangedFile(file),
      ),
      parentShas: (ghCommit.parents || []).map((p) => p.sha),
      verified: ghCommit.commit.verification?.verified || false,
      gpgSignature: ghCommit.commit.verification?.signature,
      provider: VcsProviderType.GITHUB,
    };
  }

  private mapGitHubRepoToRepositoryData(
    ghRepo: GitHubRepository,
  ): RepositoryData {
    return {
      id: String(ghRepo.id),
      name: ghRepo.name,
      fullName: ghRepo.full_name,
      htmlUrl: ghRepo.html_url,
      description: ghRepo.description || undefined,
      language: ghRepo.language || undefined,
      stargazers: ghRepo.stargazers_count,
      watchers: ghRepo.watchers_count,
      forks: ghRepo.forks_count,
      isPrivate: ghRepo.private,
      isArchived: ghRepo.archived,
      isDisabled: ghRepo.disabled,
      defaultBranch: ghRepo.default_branch,
      createdAt: new Date(ghRepo.created_at),
      updatedAt: new Date(ghRepo.updated_at),
      pushedAt: ghRepo.pushed_at ? new Date(ghRepo.pushed_at) : undefined,
      provider: VcsProviderType.GITHUB,
      ownerUrl: ghRepo.owner?.html_url,
      ownerUsername: ghRepo.owner?.login,
      ownerAvatar: ghRepo.owner?.avatar_url,
    };
  }

  private mapGitHubPullRequestToPullRequestData(
    ghPr: GitHubPullRequest,
  ): PullRequestData {
    const isDetail = this.isPullRequestDetail(ghPr);
    const mergedFlag =
      isDetail && typeof ghPr.merged === 'boolean' ? ghPr.merged : false;

    return {
      id: String(ghPr.id),
      number: ghPr.number,
      title: ghPr.title,
      body: ghPr.body || undefined,
      state: this.mapGitHubPrState(ghPr.state, mergedFlag),
      createdAt: new Date(ghPr.created_at),
      updatedAt: new Date(ghPr.updated_at),
      closedAt: ghPr.closed_at ? new Date(ghPr.closed_at) : undefined,
      mergedAt: ghPr.merged_at ? new Date(ghPr.merged_at) : undefined,
      author: {
        username: ghPr.user.login,
        url: ghPr.user.html_url,
      },
      additions: isDetail ? ghPr.additions : 0,
      deletions: isDetail ? ghPr.deletions : 0,
      changedFiles: isDetail ? ghPr.changed_files : 0,
      comments: isDetail ? ghPr.comments : 0,
      commits: isDetail ? ghPr.commits : 0,
      htmlUrl: ghPr.html_url,
      provider: VcsProviderType.GITHUB,
    };
  }

  private isPullRequestDetail(
    pr: GitHubPullRequest,
  ): pr is GitHubPullRequestDetail {
    return 'additions' in pr && 'changed_files' in pr;
  }

  private mapGitHubFileToChangedFile(ghFile: GitHubFile): ChangedFile {
    const statusMap: Record<string, ChangedFile['status']> = {
      added: 'added',
      removed: 'removed',
      modified: 'modified',
      renamed: 'renamed',
      copied: 'copied',
      changed: 'modified',
      unchanged: 'modified',
    };

    return {
      filename: ghFile.filename,
      status: statusMap[ghFile.status] ?? 'modified',
      additions: ghFile.additions,
      deletions: ghFile.deletions,
      changes: ghFile.changes,
      patch: ghFile.patch,
    };
  }

  private mapGitHubPrState(
    state: string,
    merged: boolean,
  ): 'open' | 'closed' | 'merged' | 'draft' {
    if (merged) return 'merged';
    if (state === 'open') return 'open';
    if (state === 'closed') return 'closed';
    return 'closed';
  }
}
