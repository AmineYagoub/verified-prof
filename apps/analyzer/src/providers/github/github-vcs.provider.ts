import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import {
  ChangedFile,
  CommitData,
  IVcsProvider,
  ListCommitsOptions,
  PullRequestData,
  RepositoryData,
  TreeItem,
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
  private cachedUsername?: string;

  initialize(token: string): void {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  getProviderType(): VcsProviderType {
    return VcsProviderType.GITHUB;
  }

  getOctokit(): Octokit {
    return this.octokit;
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

  async getAuthenticatedUsername(): Promise<string> {
    if (this.cachedUsername) {
      return this.cachedUsername;
    }

    try {
      const response = await this.octokit.rest.users.getAuthenticated();
      this.cachedUsername = response.data.login;
      return this.cachedUsername;
    } catch (error) {
      this.logger.error('Failed to get authenticated username', error);
      throw new Error('Failed to get authenticated username');
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
      // Handle empty repository (409 error)
      if (error.status === 409 && error.message?.includes('empty')) {
        this.logger.warn(
          `Repository ${owner}/${repo} is empty, skipping commits`,
        );
        return [];
      }
      this.logger.error('Failed to list commits', error);
      throw error;
    }
  }

  async getUserRepositories(options?: {
    perPage?: number;
    page?: number;
  }): Promise<RepositoryData[]> {
    try {
      const repos = await this.octokit.rest.repos.listForAuthenticatedUser({
        per_page: options?.perPage || 30,
        page: options?.page || 1,
        affiliation: 'owner,collaborator,organization_member',
        sort: 'updated',
      });

      // Cache the authenticated username from the first repo's owner
      if (!this.cachedUsername && repos.data.length > 0) {
        this.cachedUsername = repos.data[0].owner?.login;
      }

      return repos.data.map((repo: GitHubRepositoryListItem) =>
        this.mapGitHubRepoToRepositoryData(repo),
      );
    } catch (error) {
      const isTimeoutError =
        error instanceof Error &&
        (error.message.includes('Timeout') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ECONNRESET'));

      if (isTimeoutError) {
        this.logger.warn(
          'GitHub API timeout while fetching repositories, returning empty list',
        );
        return [];
      }

      this.logger.error(
        'Failed to list repositories for authenticated user',
        error,
      );
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
      // Handle empty repository or PR without commits
      if (error.status === 409 || error.status === 404) {
        this.logger.warn(
          `PR ${owner}/${repo}#${prNumber} has no commits or repo is empty`,
        );
        return [];
      }
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

  async getRepositoryTree(
    owner: string,
    repo: string,
    recursive = true,
  ): Promise<TreeItem[]> {
    try {
      const { data: repo_data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      if (repo_data.size === 0) {
        this.logger.warn(`Repository ${owner}/${repo} is empty, skipping tree`);
        return [];
      }

      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: repo_data.default_branch,
        recursive: recursive ? 'true' : undefined,
      });

      return data.tree.map((item) => ({
        path: item.path || '',
        type: item.type as 'blob' | 'tree' | 'commit',
        sha: item.sha || '',
        size: item.size,
        mode: item.mode,
        url: item.url,
      }));
    } catch (error) {
      if (error.status === 409) {
        this.logger.warn(
          `Repository ${owner}/${repo} is empty or has no commits`,
        );
        return [];
      }
      if (error.status === 404) {
        this.logger.warn(
          `Repository ${owner}/${repo} not found or inaccessible`,
        );
        return [];
      }
      this.logger.error(
        `Failed to get repository tree for ${owner}/${repo}: ${error.message}`,
        error,
      );
      return [];
    }
  }

  async getUserCommits(
    owner: string,
    repo: string,
    author: string,
    perPage = 100,
  ): Promise<CommitData[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        author,
        per_page: perPage,
      });

      const commits: CommitData[] = [];

      for (const commit of response.data) {
        const commitData = await this.getCommit(owner, repo, commit.sha);
        commits.push(commitData);
      }

      return commits;
    } catch (error) {
      this.logger.error(
        `Failed to get user commits for ${author} in ${owner}/${repo}`,
        error,
      );
      return [];
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

  async getUserActivityMetrics(username: string): Promise<{
    followers: number;
    following: number;
    publicRepos: number;
    publicGists: number;
    totalStars: number;
    accountCreated: Date;
    profileBio?: string;
    location?: string;
    company?: string;
    blog?: string;
    hireable?: boolean;
  }> {
    try {
      const user = await this.octokit.rest.users.getByUsername({ username });

      let totalStars = 0;
      try {
        const repos = await this.octokit.rest.repos.listForUser({
          username,
          per_page: 100,
          type: 'owner',
        });
        totalStars = repos.data.reduce(
          (sum, repo) => sum + repo.stargazers_count,
          0,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to calculate total stars for ${username}`,
          error,
        );
      }

      return {
        followers: user.data.followers,
        following: user.data.following,
        publicRepos: user.data.public_repos,
        publicGists: user.data.public_gists,
        totalStars,
        accountCreated: new Date(user.data.created_at),
        profileBio: user.data.bio || undefined,
        location: user.data.location || undefined,
        company: user.data.company || undefined,
        blog: user.data.blog || undefined,
        hireable: user.data.hireable || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get activity metrics for ${username}`,
        error,
      );
      throw error;
    }
  }

  async getStarredRepositories(
    username: string,
    options?: { perPage?: number; page?: number },
  ): Promise<
    Array<{
      name: string;
      fullName: string;
      language?: string;
      stars: number;
      topics: string[];
    }>
  > {
    try {
      const response = await this.octokit.rest.activity.listReposStarredByUser({
        username,
        per_page: options?.perPage || 50,
        page: options?.page || 1,
      });

      return response.data.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        language: repo.language || undefined,
        stars: repo.stargazers_count,
        topics: repo.topics || [],
      }));
    } catch (error) {
      this.logger.error(`Failed to get starred repos for ${username}`, error);
      return [];
    }
  }

  async getPublicEvents(
    username: string,
    options?: { perPage?: number; page?: number },
  ): Promise<
    Array<{
      type: string;
      repo: string;
      createdAt: Date;
      payload?: unknown;
    }>
  > {
    try {
      const response = await this.octokit.rest.activity.listPublicEventsForUser(
        {
          username,
          per_page: options?.perPage || 90,
          page: options?.page || 1,
        },
      );

      return response.data.map((event) => ({
        type: event.type,
        repo: event.repo.name,
        createdAt: new Date(event.created_at),
        payload: event.payload,
      }));
    } catch (error) {
      this.logger.error(`Failed to get public events for ${username}`, error);
      return [];
    }
  }

  async getUserGists(
    username: string,
    options?: { perPage?: number; page?: number },
  ): Promise<
    Array<{
      id: string;
      description?: string;
      public: boolean;
      files: string[];
      createdAt: Date;
      updatedAt: Date;
      comments: number;
    }>
  > {
    try {
      const response = await this.octokit.rest.gists.listForUser({
        username,
        per_page: options?.perPage || 30,
        page: options?.page || 1,
      });

      return response.data.map((gist) => ({
        id: gist.id,
        description: gist.description || undefined,
        public: gist.public,
        files: Object.keys(gist.files || {}),
        createdAt: new Date(gist.created_at),
        updatedAt: new Date(gist.updated_at),
        comments: gist.comments,
      }));
    } catch (error) {
      this.logger.error(`Failed to get gists for ${username}`, error);
      return [];
    }
  }

  async getForkedRepositories(options?: {
    perPage?: number;
    page?: number;
  }): Promise<
    Array<{
      name: string;
      fullName: string;
      parent: string;
      language?: string;
      forkedAt: Date;
      hasContributions: boolean;
    }>
  > {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        per_page: options?.perPage || 100,
        page: options?.page || 1,
        affiliation: 'owner',
      });

      const forkedRepos = response.data.filter((repo) => repo.fork);

      return forkedRepos.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        parent: 'unknown',
        language: repo.language || undefined,
        forkedAt: new Date(repo.created_at),
        hasContributions: repo.pushed_at
          ? new Date(repo.pushed_at) > new Date(repo.created_at)
          : false,
      }));
    } catch (error) {
      this.logger.error('Failed to get forked repositories', error);
      return [];
    }
  }

  async getRepositoryTopics(owner: string, repo: string): Promise<string[]> {
    try {
      const response = await this.octokit.rest.repos.getAllTopics({
        owner,
        repo,
      });
      return response.data.names || [];
    } catch (error) {
      this.logger.warn(`Failed to get topics for ${owner}/${repo}`, error);
      return [];
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
