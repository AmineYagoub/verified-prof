import { VcsProviderType } from './vcs-provider.interface';

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  type: VcsProviderType;
  token: string;
  baseUrl?: string; // For self-hosted instances (GitLab, Gitea)
  timeout?: number; // Request timeout in ms
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Multi-provider configuration
 */
export interface VerifiedProfProviderConfig {
  defaultProvider: VcsProviderType;
  providers: {
    [key in VcsProviderType]?: ProviderConfig;
  };
  cacheCommits?: boolean;
  cacheTTL?: number; // in seconds
}

/**
 * Environment-based provider configuration
 */
export class ProviderConfigFactory {
  static fromEnvironment(): VerifiedProfProviderConfig {
    return {
      defaultProvider: (process.env['DEFAULT_VCS_PROVIDER'] ||
        'github') as VcsProviderType,
      providers: {
        [VcsProviderType.GITHUB]: {
          type: VcsProviderType.GITHUB,
          token: process.env['GITHUB_TOKEN'] || '',
          timeout: parseInt(process.env['GITHUB_TIMEOUT'] || '30000'),
          retryAttempts: parseInt(process.env['GITHUB_RETRY_ATTEMPTS'] || '3'),
        },
        [VcsProviderType.GITLAB]: process.env['GITLAB_TOKEN']
          ? {
              type: VcsProviderType.GITLAB,
              token: process.env['GITLAB_TOKEN'],
              baseUrl: process.env['GITLAB_BASE_URL'],
              timeout: parseInt(process.env['GITLAB_TIMEOUT'] || '30000'),
              retryAttempts: parseInt(
                process.env['GITLAB_RETRY_ATTEMPTS'] || '3',
              ),
            }
          : undefined,
        [VcsProviderType.BITBUCKET]: process.env['BITBUCKET_TOKEN']
          ? {
              type: VcsProviderType.BITBUCKET,
              token: process.env['BITBUCKET_TOKEN'],
              timeout: parseInt(process.env['BITBUCKET_TIMEOUT'] || '30000'),
              retryAttempts: parseInt(
                process.env['BITBUCKET_RETRY_ATTEMPTS'] || '3',
              ),
            }
          : undefined,
      },
      cacheCommits: process.env['CACHE_COMMITS'] !== 'false',
      cacheTTL: parseInt(process.env['CACHE_TTL'] || '3600'),
    };
  }
}
