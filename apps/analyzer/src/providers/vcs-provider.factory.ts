import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@verified-prof/prisma';
import { createHash } from 'crypto';
import {
  IVcsProvider,
  IVcsProviderFactory,
  JOB_EVENTS,
  VcsProviderType,
  decrypt,
} from '@verified-prof/shared';
import { GitHubVcsProvider } from './github/github-vcs.provider';
import { APP_CONFIG_REGISTER_KEY, AppConfigType } from '@verified-prof/config';

@Injectable()
export class VcsProviderFactory implements IVcsProviderFactory {
  private readonly logger = new Logger(VcsProviderFactory.name);
  private providers: Map<string, IVcsProvider> = new Map();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create provider for authenticated user
   * Uses cached tokens from database
   */
  async createProviderForUser(
    userId: string,
    type: VcsProviderType = VcsProviderType.GITHUB,
  ): Promise<IVcsProvider> {
    const cacheKey = `${type}:${userId}`;
    const cached = this.providers.get(cacheKey);
    if (cached) {
      return cached;
    }

    const token = await this.getUserToken(userId, type);
    const provider = await this.createProviderByType(type, token);
    this.providers.set(cacheKey, provider);

    return provider;
  }

  /**
   * Create provider with explicit token (for testing/admin)
   */
  async createProvider(
    type: VcsProviderType,
    token: string,
  ): Promise<IVcsProvider> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const cacheKey = `${type}:token:${tokenHash.substring(0, 10)}`;
    const cached = this.providers.get(cacheKey);
    if (cached) {
      return cached;
    }

    const provider = await this.createProviderByType(type, token);
    this.providers.set(cacheKey, provider);

    return provider;
  }

  async createGitHubProvider(token: string): Promise<IVcsProvider> {
    return this.createProvider(VcsProviderType.GITHUB, token);
  }

  async createGitLabProvider(): Promise<IVcsProvider> {
    throw new Error('GitLab provider not yet implemented');
  }

  async createBitbucketProvider(): Promise<IVcsProvider> {
    throw new Error('Bitbucket provider not yet implemented');
  }

  private async createProviderByType(
    type: VcsProviderType,
    token: string,
  ): Promise<IVcsProvider> {
    this.logger.log(`Creating ${type} provider`);

    switch (type) {
      case VcsProviderType.GITHUB: {
        const ghProvider = new GitHubVcsProvider();
        ghProvider.initialize(token);
        return ghProvider;
      }
      case VcsProviderType.GITLAB:
        throw new Error('GitLab provider not yet implemented');

      case VcsProviderType.BITBUCKET:
        throw new Error('Bitbucket provider not yet implemented');

      case VcsProviderType.GITEA:
        throw new Error('Gitea provider not yet implemented');

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Get user's token from database with caching
   */
  private async getUserToken(
    userId: string,
    type: VcsProviderType,
  ): Promise<string> {
    const cacheKey = `${type}-authToken-${userId}`;
    let token = (await this.cacheManager.get(cacheKey)) as string | undefined;
    if (!token) {
      const providerId = type; // 'github', 'gitlab', etc.
      const account = await this.prisma.$.account.findFirstOrThrow({
        where: { userId, providerId },
      });
      if (!account.accessToken) {
        throw new Error(`No access token found for user ${userId} on ${type}`);
      }
      token = decrypt(account.accessToken, userId);
      await this.cacheManager.set(cacheKey, token, 3600);
    }
    return token;
  }

  async getDefaultProvider(userId: string): Promise<IVcsProvider> {
    const appConfig = this.configService.get<AppConfigType>(
      APP_CONFIG_REGISTER_KEY,
    );
    const providerType =
      (appConfig.app.vcsProvider as VcsProviderType) || VcsProviderType.GITHUB;
    const token = await this.getUserToken(userId, providerType);
    if (!token) {
      throw new Error(`No token configured for ${providerType}`);
    }
    return this.createProvider(providerType, token);
  }

  async clearProviderCacheForUser(
    userId: string,
    type?: VcsProviderType | string,
  ): Promise<void> {
    if (type) {
      const prefix = `${type}:${userId}`;
      for (const key of Array.from(this.providers.keys())) {
        if (key.startsWith(prefix)) {
          this.providers.delete(key);
        }
      }
      const tokenCacheKey = `${type}-authToken-${userId}`;
      await this.cacheManager.del(tokenCacheKey);
      return;
    }
    for (const key of Array.from(this.providers.keys())) {
      if (key.includes(`:${userId}`)) this.providers.delete(key);
    }
    const potentialProviders = Object.values(VcsProviderType) as string[];
    for (const p of potentialProviders) {
      await this.cacheManager.del(`${p}-authToken-${userId}`);
    }
  }

  /**
   * Get provider for user's repository
   * Fetches user's token from database
   */
  @OnEvent(JOB_EVENTS.ACCOUNT_UPDATED)
  async handleAccountUpdated(payload: { userId: string; providerId?: string }) {
    await this.clearProviderCacheForUser(payload.userId, payload.providerId);
  }

  async getProviderForUser(
    userId: string,
    type: VcsProviderType = VcsProviderType.GITHUB,
  ): Promise<IVcsProvider> {
    return this.createProviderForUser(userId, type);
  }
}
