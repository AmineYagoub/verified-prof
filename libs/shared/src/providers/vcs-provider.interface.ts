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
  message: string;
  repository: string;
  extension: string;
  content: string;
  sha: string;
}

export interface CommitDetails {
  sha: string;
  contents: CommitsContent[];
}

export interface AnalyzerResults {
  repository: string;
  owner: string;
  commits: CommitDetails[];
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
  }): Promise<AnalyzerResults[]>;
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
