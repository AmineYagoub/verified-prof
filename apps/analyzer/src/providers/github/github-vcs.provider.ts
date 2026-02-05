import { Injectable, Logger } from '@nestjs/common';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';
import {
  AnalyzerResults,
  CommitDetails,
  CommitsContent,
  IVcsProvider,
  VcsProviderType,
} from '@verified-prof/shared';
import path from 'path';

type GitHubCommit = Awaited<
  ReturnType<Octokit['rest']['repos']['getCommit']>
>['data'];
type GitHubFile = GitHubCommit['files'][number];

@Injectable()
export class GitHubVcsProvider implements IVcsProvider {
  private readonly logger = new Logger(GitHubVcsProvider.name);
  private octokit!: Octokit;
  private requestCount = 0;

  private static readonly CODE_EXTENSIONS: readonly string[] = [
    '.js',
    '.mjs',
    '.cjs',
    '.jsx',
    '.ts',
    '.tsx',
    '.py',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.java',
    '.php',
    '.rb',
    '.cs',
    '.cpp',
    '.c',
    '.scala',
    '.vue',
    '.svelte',
  ];

  private static readonly CONFIG_FILES: readonly string[] = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    'jest.config.ts',
    'jest.config.cjs',
    'jest.config.mjs',
    'vitest.config.js',
    'vitest.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'webpack.config.js',
    'webpack.config.ts',
    'rollup.config.js',
    'rollup.config.ts',
    'esbuild.config.js',
    'esbuild.config.ts',
    'playwright.config.js',
    'playwright.config.ts',
    'schema.prisma',
    'ormconfig.json',
    'ormconfig.js',
    'knexfile.js',
    'knexfile.ts',
    'drizzle.config.ts',
    '.eslintrc.js',
    '.eslintrc.json',
    '.prettierrc.js',
    '.prettierrc.json',
  ];

  private static readonly INFRASTRUCTURE_PATTERNS: readonly RegExp[] = [
    /^\.github\/workflows\/.*\.ya?ml$/,
    /^\.gitlab-ci\.ya?ml$/,
    /^\.circleci\/config\.ya?ml$/,
    /^Jenkinsfile$/,
    /^docker-compose.*\.ya?ml$/,
    /^Dockerfile(\.\w+)?$/,
    /^k8s\/.*\.ya?ml$/,
    /^\.github\/dependabot\.ya?ml$/,
    /^nginx\.conf$/,
  ];

  private static readonly EXCLUDE_EXTENSIONS: readonly string[] = [
    '.md',
    '.txt',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.webp',
    '.pdf',
    '.docx',
    '.xlsx',
    '.pptx',
    '.lock',
    '.env',
    '.env.local',
    '.env.example',
    '.env.development',
    '.log',
    '.map',
    '.d.ts',
    '.test.ts',
    '.test.js',
    '.spec.ts',
    '.spec.js',
    '.snap',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.html',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];

  private static readonly EXCLUDE_DIRS: readonly string[] = [
    'node_modules',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    'coverage',
    'tests',
    'test',
    '__tests__',
    'spec',
    '__snapshots__',
    'fixtures',
    'mocks',
    'stubs',
    'docs',
    'documentation',
    'examples',
    'demo',
    'samples',
    'assets',
    'images',
    'static',
    'public/images',
    'public/icons',
    'vendor',
    'third_party',
    'site-packages',
    'packages',
    '.git',
    '.svn',
    '.hg',
    'tmp',
    'temp',
    'cache',
    '.vscode',
    '.idea',
    '.DS_Store',
  ];

  initialize(token: string): void {
    const IOctokit = Octokit.plugin(throttling);
    this.octokit = new IOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`,
          );
          if (options.request.retryCount <= 2) {
            return true;
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          octokit.log.error(
            `Secondary rate limit hit for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`,
          );
          return true;
        },
      },
    });
  }

  getProviderType(): VcsProviderType {
    return VcsProviderType.GITHUB;
  }

  getOctokit() {
    if (!this.octokit) {
      throw new Error(
        'GitHub provider not initialized. Call initialize() first.',
      );
    }
    return this.octokit;
  }

  private async getSetOfCommitsFromRepo(
    repo: string,
    owner: string,
    maxCommits: number,
    commitsPerPage: number,
  ): Promise<Set<string>> {
    const commitsShaSet = new Set<string>();
    let currentPage = 1;
    try {
      while (commitsShaSet.size < maxCommits) {
        const { data: commits } = await this.octokit.rest.repos.listCommits({
          owner: owner,
          repo: repo,
          per_page: Math.min(commitsPerPage, maxCommits - commitsShaSet.size),
          page: currentPage,
        });
        this.requestCount++;
        if (commits.length === 0) {
          break;
        }
        for (const commit of commits) {
          if (commitsShaSet.size >= maxCommits) break;
          commitsShaSet.add(commit.sha);
        }
        currentPage++;
        if (commits.length < commitsPerPage) {
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Error fetching commits: ${error.message}`);
    }
    return commitsShaSet;
  }

  private async getFileChangesInCommit(
    repo: string,
    owner: string,
    files: GitHubFile[],
    currentCommitSha: string,
    currentCommitMessage: string,
  ): Promise<CommitsContent[]> {
    const contents: CommitsContent[] = [];

    for (const file of files) {
      const fileName = file.filename;
      const extension = path.extname(fileName).toLowerCase();
      const baseName = path.basename(fileName);
      if (file.status === 'removed' || file.status === 'renamed') {
        continue;
      }
      if (
        GitHubVcsProvider.EXCLUDE_DIRS.some((dir) => {
          const pattern = new RegExp(`(^|/)${dir}(/|$)`);
          return pattern.test(fileName);
        })
      ) {
        continue;
      }
      if (GitHubVcsProvider.EXCLUDE_EXTENSIONS.includes(extension)) {
        continue;
      }
      const isCodeFile = GitHubVcsProvider.CODE_EXTENSIONS.includes(extension);
      const isConfigFile = GitHubVcsProvider.CONFIG_FILES.includes(baseName);
      const isInfrastructureFile =
        GitHubVcsProvider.INFRASTRUCTURE_PATTERNS.some((pattern) =>
          pattern.test(fileName),
        );
      if (!isCodeFile && !isConfigFile && !isInfrastructureFile) {
        continue;
      }

      try {
        const { data: contentData } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: fileName,
          ref: currentCommitSha,
        });
        this.requestCount++;
        if ('content' in contentData) {
          const fileContent = Buffer.from(
            contentData.content,
            'base64',
          ).toString('utf-8');
          let fileType: 'code' | 'config' | 'infrastructure' = 'code';
          if (isInfrastructureFile) {
            fileType = 'infrastructure';
          } else if (isConfigFile) {
            fileType = 'config';
          }

          contents.push({
            filename: fileName,
            content: fileContent,
            sha: file.sha,
            extension,
            changes: file.changes,
            additions: file.additions,
            deletions: file.deletions,
            repository: repo,
            message: currentCommitMessage,
            fileType,
          });
        }
      } catch (error) {
        this.logger.debug(
          `Skipping file ${fileName} in commit ${currentCommitSha}: ${error.message}`,
        );
        continue;
      }
    }
    return contents;
  }

  private async getCommitDetails(
    repo: string,
    owner: string,
    valSet: Set<string>,
    maxFilesPerCommit: number,
  ): Promise<CommitDetails[]> {
    const commitDetailsArray: CommitDetails[] = [];
    for (const sha of valSet) {
      try {
        const { data: commitDetails } = await this.octokit.rest.repos.getCommit(
          {
            owner: owner,
            repo: repo,
            ref: sha,
          },
        );
        this.requestCount++;
        const filesWithContent = await this.getFileChangesInCommit(
          repo,
          owner,
          commitDetails.files.slice(0, maxFilesPerCommit) || [],
          commitDetails.sha,
          commitDetails.commit.message,
        );
        if (filesWithContent.length !== 0) {
          commitDetailsArray.push({
            sha: commitDetails.sha,
            contents: filesWithContent,
            author: commitDetails.commit.author
              ? {
                  name: commitDetails.commit.author.name || '',
                  email: commitDetails.commit.author.email || '',
                  date: commitDetails.commit.author.date || '',
                }
              : undefined,
            stats: commitDetails.stats
              ? {
                  additions: commitDetails.stats.additions || 0,
                  deletions: commitDetails.stats.deletions || 0,
                }
              : undefined,
            parentShas: commitDetails.parents.map((p) => p.sha),
          });
        }
      } catch (error) {
        this.logger.error(
          `Error fetching commit details for SHA ${sha}: ${error.message}`,
        );
      }
    }
    return commitDetailsArray;
  }

  async getLatestCommitsContent(options: {
    maxRepo: number;
    maxCommits: number;
    maxFilesPerCommit: number;
    commitsPerPage: number;
    repositoriesPerPage: number;
  }) {
    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      per_page: options.repositoriesPerPage,
      page: 1,
      affiliation: 'owner,collaborator,organization_member',
      sort: 'updated',
    });
    this.requestCount++;
    const analyzedData: AnalyzerResults[] = [];
    const myRepos = response.data.filter(
      (repo) => !repo.disabled && !repo.archived && !repo.fork && repo.size > 0,
    );
    for (const repo of myRepos) {
      const commitsSet = await this.getSetOfCommitsFromRepo(
        repo.name,
        repo.owner.login,
        options.maxCommits,
        options.commitsPerPage,
      );
      const commitDetails = await this.getCommitDetails(
        repo.name,
        repo.owner.login,
        commitsSet,
        options.maxFilesPerCommit,
      );
      if (commitDetails.length !== 0) {
        analyzedData.push({
          repository: repo.full_name,
          owner: repo.owner.login,
          commits: commitDetails,
        });
      }
      this.logger.debug(
        `Processed repository: ${repo.full_name}, Total requests made: ${this.requestCount}`,
      );
      if (analyzedData.length >= options.maxRepo) {
        break;
      }
    }
    return analyzedData;
  }
}
