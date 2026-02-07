/**
 * Supported VCS provider types
 */
export enum VcsProviderType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
  GITEA = 'gitea',
}

export interface CommitsContent {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  //message: string;
  repository: string;
  extension: string;
  content: string;
  sha: string;
  fileType?: 'code' | 'config' | 'infrastructure'; // For tech detection processing
}

export interface CommitDetails {
  sha: string;
  message: string;
  contents: CommitsContent[];
  author?: {
    name: string;
    email: string;
    date: string;
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  parentShas?: string[];
}

export interface AnalyzerResults {
  repository: string;
  owner: string;
  commits: CommitDetails[];
}

export interface PullRequestReview {
  commitSha: string;
  prNumber: number;
  reviewedAt: Date;
  commentsCount: number;
  changesRequested: boolean;
  approved: boolean;
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

  getLatestCommitsContent(options: {
    maxRepo: number;
    maxCommits: number;
    maxFilesPerCommit: number;
    commitsPerPage: number;
    repositoriesPerPage: number;
  }): Promise<AnalyzerResults[]>;

  getCollaborationData(
    repo: string,
    owner: string,
  ): Promise<PullRequestReview[]>;

  getContributors(repo: string, owner: string): Promise<{ teamSize: number }>;
}

/**
 * Provider factory for creating provider instances
 */
export interface IVcsProviderFactory {
  createProviderForUser(
    userId: string,
    type: VcsProviderType,
  ): Promise<IVcsProvider>;

  // Clears cached provider instances and cached tokens for a given user
  clearProviderCacheForUser(
    userId: string,
    type?: VcsProviderType | string,
  ): Promise<void>;
}
