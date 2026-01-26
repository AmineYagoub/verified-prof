import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class AiDataSanitizerService {
  private readonly sensitivePatterns = [
    /\b[\w.-]+@[\w.-]+\.\w+\b/gi,
    /\b(?:password|pwd|secret|key|token|api[_-]?key)\s*[:=]\s*['"]?[\w-]+['"]?/gi,
    /https?:\/\/[^\s]+/gi,
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    /\bAKIA[0-9A-Z]{16}\b/g,
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
  ];

  sanitizeEmail(email: string): string {
    const hash = createHash('sha256').update(email.toLowerCase()).digest('hex');
    return `user_${hash.substring(0, 8)}`;
  }

  sanitizeCommitMessage(message: string): string {
    const firstLine = message.split('\n')[0];
    let sanitized = firstLine;

    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized.substring(0, 100);
  }

  sanitizeFilePath(filePath: string): { extension: string; directory: string } {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    const extension = fileName.includes('.')
      ? fileName.split('.').pop() || 'unknown'
      : 'no-extension';

    const topLevelDir = parts.length > 1 ? parts[0] : 'root';

    return {
      extension,
      directory: topLevelDir,
    };
  }

  sanitizeRepositoryName(fullName: string, isPrivate: boolean): string {
    if (!isPrivate) {
      return fullName;
    }

    const parts = fullName.split('/');
    const hash = createHash('sha256').update(fullName).digest('hex');
    return `${parts[0]}/private_${hash.substring(0, 8)}`;
  }

  sanitizeAchievementTitle(title: string): string {
    let sanitized = title;

    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    const words = sanitized.split(' ');
    if (words.length > 10) {
      return words.slice(0, 10).join(' ') + '...';
    }

    return sanitized;
  }

  extractFileExtensions(filePaths: string[]): Record<string, number> {
    const extensions: Record<string, number> = {};

    for (const path of filePaths) {
      const { extension } = this.sanitizeFilePath(path);
      extensions[extension] = (extensions[extension] || 0) + 1;
    }

    return extensions;
  }

  extractDirectoryPatterns(filePaths: string[]): Record<string, number> {
    const directories: Record<string, number> = {};

    for (const path of filePaths) {
      const { directory } = this.sanitizeFilePath(path);
      directories[directory] = (directories[directory] || 0) + 1;
    }

    return directories;
  }

  sanitizeUserProfile(profile: {
    bio?: string;
    location?: string;
    company?: string;
    blog?: string;
  }): {
    hasBio: boolean;
    hasLocation: boolean;
    hasCompany: boolean;
    hasBlog: boolean;
  } {
    return {
      hasBio: !!profile.bio,
      hasLocation: !!profile.location,
      hasCompany: !!profile.company,
      hasBlog: !!profile.blog,
    };
  }

  sanitizeGistDescription(description: string): string {
    if (!description || description.length === 0) {
      return 'No description';
    }

    let sanitized = description;

    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized.substring(0, 100);
  }

  filterPublicDataOnly<T extends { isPrivate?: boolean }>(items: T[]): T[] {
    return items.filter((item) => !item.isPrivate);
  }

  aggregateLanguageStats(languages: string[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const lang of languages) {
      stats[lang] = (stats[lang] || 0) + 1;
    }

    return stats;
  }

  sanitizeEventPayload(eventType: string): {
    type: string;
    sanitizedInfo: string;
  } {
    switch (eventType) {
      case 'PushEvent':
        return {
          type: 'PushEvent',
          sanitizedInfo: 'Code pushed to repository',
        };
      case 'PullRequestEvent':
        return {
          type: 'PullRequestEvent',
          sanitizedInfo: 'Pull request activity',
        };
      case 'IssuesEvent':
        return {
          type: 'IssuesEvent',
          sanitizedInfo: 'Issue activity',
        };
      case 'CreateEvent':
        return {
          type: 'CreateEvent',
          sanitizedInfo: 'Created new resource',
        };
      case 'ForkEvent':
        return {
          type: 'ForkEvent',
          sanitizedInfo: 'Forked repository',
        };
      case 'WatchEvent':
        return {
          type: 'WatchEvent',
          sanitizedInfo: 'Starred repository',
        };
      default:
        return {
          type: eventType,
          sanitizedInfo: 'GitHub activity',
        };
    }
  }

  removeGpgSignatures<T extends { gpgSignature?: string }>(
    items: T[],
  ): Omit<T, 'gpgSignature'>[] {
    return items.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { gpgSignature, ...rest } = item;
      return rest;
    });
  }

  sanitizeRepositoryTopics(topics: string[]): string[] {
    return topics.map((topic) =>
      topic.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    );
  }
}
