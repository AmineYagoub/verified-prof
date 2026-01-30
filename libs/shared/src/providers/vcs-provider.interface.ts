/**
 * Supported VCS provider types
 */
export enum VcsProviderType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
  GITEA = 'gitea',
}

/**
 * Represents a commit from any VCS provider
 * Normalized to a common interface
 */
export interface CommitData {
  // Unique identifiers
  sha: string;
  htmlUrl: string;
  authorUrl?: string;

  // Author information
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorUsername?: string;

  // Commit content
  message: string;
  body?: string;
  committerDate: Date;
  authorDate: Date;

  // Changes
  filesChanged: number;
  additions: number;
  deletions: number;
  changedFiles?: ChangedFile[];

  // Parent commits
  parentShas: string[];

  // Verification
  verified?: boolean;
  gpgSignature?: string;

  // Additional metadata
  provider: VcsProviderType;
}

/**
 * Represents a file changed in a commit
 */
export interface ChangedFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

/**
 * Represents a tree item from repository tree
 */
export interface TreeItem {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  mode?: string;
  url?: string;
}

/**
 * Represents a repository from any VCS provider
 */
export interface RepositoryData {
  id: string;
  name: string;
  fullName: string; // owner/repo format
  htmlUrl: string;
  description?: string;
  language?: string;
  languages?: Record<string, number>;
  stargazers?: number;
  watchers?: number;
  forks?: number;
  isPrivate: boolean;
  isArchived: boolean;
  isDisabled?: boolean;
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
  pushedAt?: Date;
  provider: VcsProviderType;
  ownerUrl?: string;
  ownerUsername?: string;
  ownerAvatar?: string;
}

/**
 * Represents a user profile from any VCS provider
 */
export interface UserData {
  id: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  profileUrl: string;
  bio?: string;
  location?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  createdAt: Date;
  updatedAt?: Date;
  provider: VcsProviderType;
}

/**
 * Options for listing commits
 */
export interface ListCommitsOptions {
  since?: Date;
  until?: Date;
  branch?: string;
  author?: string;
  path?: string;
  perPage?: number;
  page?: number;
}

/**
 * Pull request/Merge request abstraction
 */
export interface PullRequestData {
  id: string | number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  mergedAt?: Date;
  author: {
    username: string;
    url: string;
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  commits: number;
  htmlUrl: string;
  provider: VcsProviderType;
}

/**
 * Abstract VCS Provider Interface
 * All implementations must provide these methods
 */
export interface IVcsProvider {
  /**
   * Initialize the provider with authentication token
   * Creates the underlying client instance
   */
  initialize(token: string): void;

  /**
   * Get provider type
   */
  getProviderType(): VcsProviderType;

  /**
   * Get the underlying client instance for advanced operations
   */
  getOctokit?(): unknown;

  /**
   * Authenticate with the provider
   * Implementation varies by provider
   */
  authenticate(token: string): Promise<void>;

  /**
   * Get the authenticated user's username
   */
  getAuthenticatedUsername(): Promise<string>;

  /**
   * Get a single commit
   */
  getCommit(owner: string, repo: string, sha: string): Promise<CommitData>;

  /**
   * List commits from a repository
   */
  listCommits(
    owner: string,
    repo: string,
    options?: ListCommitsOptions,
  ): Promise<CommitData[]>;

  /**
   * List all repositories for authenticated user
   */
  getUserRepositories(options?: {
    perPage?: number;
    page?: number;
  }): Promise<RepositoryData[]>;

  /**
   * List pull requests
   */
  listPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
      page?: number;
    },
  ): Promise<PullRequestData[]>;

  /**
   * Get commits in a pull request
   */
  getPullRequestCommits(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<CommitData[]>;

  /**
   * Get programming languages used in a repository with byte counts
   */
  getRepositoryLanguages(
    owner: string,
    repo: string,
  ): Promise<Record<string, number>>;

  /**
   * Get repository file tree
   */
  getRepositoryTree(
    owner: string,
    repo: string,
    recursive?: boolean,
  ): Promise<TreeItem[]>;

  /**
   * Get commits by a specific user/author
   */
  getUserCommits(
    owner: string,
    repo: string,
    author: string,
    perPage?: number,
  ): Promise<CommitData[]>;

  /**
   * Rate limit status
   */
  getRateLimit(): Promise<{
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  }>;
}

/**
 * Provider factory for creating provider instances
 */
export interface IVcsProviderFactory {
  createProvider(type: VcsProviderType, token: string): Promise<IVcsProvider>;

  createGitHubProvider(token: string): Promise<IVcsProvider>;
  createGitLabProvider(token: string): Promise<IVcsProvider>;
  createBitbucketProvider(token: string): Promise<IVcsProvider>;

  // Clears cached provider instances and cached tokens for a given user
  clearProviderCacheForUser(
    userId: string,
    type?: VcsProviderType | string,
  ): Promise<void>;
}
