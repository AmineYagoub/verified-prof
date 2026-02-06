import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  IVcsProvider,
  IVcsProviderFactory,
  JOB_EVENTS,
  VcsProviderType,
  decrypt,
} from '@verified-prof/shared';
import { Cache } from 'cache-manager';
import { GitHubVcsProvider } from './github/github-vcs.provider';

@Injectable()
export class VcsProviderFactory implements IVcsProviderFactory {
  private readonly logger = new Logger(VcsProviderFactory.name);
  private readonly MAX_CACHED_PROVIDERS = 100;
  private providers: Map<string, IVcsProvider> = new Map();

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * LRU-style cache set with eviction when max size is reached
   */
  private cacheSetProvider(key: string, provider: IVcsProvider): void {
    if (this.providers.size >= this.MAX_CACHED_PROVIDERS) {
      const firstKey = this.providers.keys().next().value;
      this.providers.delete(firstKey);
    }
    this.providers.set(key, provider);
  }

  /**
   * Create provider for authenticated user
   * Uses cached tokens from database
   */
  async createProviderForUser(
    userId: string,
    type: VcsProviderType,
  ): Promise<IVcsProvider> {
    const cacheKey = `${type}:${userId}`;
    const cached = this.providers.get(cacheKey);
    if (cached) {
      return cached;
    }

    const token = await this.getUserToken(userId, type);
    const provider = await this.createProviderByType(type, token);
    this.cacheSetProvider(cacheKey, provider);

    return provider;
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

  @OnEvent(JOB_EVENTS.ACCOUNT_UPDATED)
  async handleAccountUpdated(payload: { userId: string; providerId?: string }) {
    await this.clearProviderCacheForUser(payload.userId, payload.providerId);
  }
}
