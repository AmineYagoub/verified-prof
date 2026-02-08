import { Storage } from '@google-cloud/storage';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_CONFIG_REGISTER_KEY, AppConfigType } from '@verified-prof/config';
import { PrismaService } from '@verified-prof/prisma';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_VALIDATION_ERRORS,
  MAX_AVATAR_FILE_SIZE,
  ProfileAvatarUploadResult,
} from '@verified-prof/shared';
import { createHash } from 'crypto';
import { existsSync } from 'fs';

@Injectable()
export class ProfileAvatarService {
  private readonly logger = new Logger(ProfileAvatarService.name);
  private storage: Storage;
  private bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const appConfig = this.configService.get<AppConfigType>(
      APP_CONFIG_REGISTER_KEY,
    );
    this.bucketName = appConfig.gcp.bucketName;
    const isCloudRun = process.env.K_SERVICE !== undefined;
    try {
      if (isCloudRun) {
        this.storage = new Storage({
          projectId: appConfig.gcp.projectId,
        });
      } else {
        if (!appConfig.gcp.keyFilename) {
          throw new Error(
            'GCP_KEY_FILENAME is not configured in environment variables',
          );
        }
        if (!existsSync(appConfig.gcp.keyFilename)) {
          throw new Error(
            `GCP service account key file not found at path: ${appConfig.gcp.keyFilename}`,
          );
        }
        this.storage = new Storage({
          projectId: appConfig.gcp.projectId,
          keyFilename: appConfig.gcp.keyFilename,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Google Cloud Storage: ${error.message}`,
      );
      throw new Error(
        'Google Cloud Storage initialization failed. Check your credentials.',
      );
    }
  }

  async uploadAvatar(
    userId: string,
    file: Buffer,
    mimeType: string,
  ): Promise<ProfileAvatarUploadResult> {
    if (!this.bucketName || !this.storage) {
      throw new BadRequestException('Avatar upload not configured');
    }
    if (
      !ALLOWED_AVATAR_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException(AVATAR_VALIDATION_ERRORS.INVALID_TYPE);
    }
    if (file.length > MAX_AVATAR_FILE_SIZE) {
      throw new BadRequestException(AVATAR_VALIDATION_ERRORS.FILE_TOO_LARGE);
    }
    const extension = this.getExtensionFromMimeType(mimeType);
    const filename = this.generateFilename(userId, extension);
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(`avatars/${filename}`);
    await blob.save(file, {
      metadata: {
        contentType: mimeType,
        metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/avatars/${filename}`;
    return { url: publicUrl, filename };
  }

  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    const imageUrl = user?.image;
    if (!this.bucketName || !this.storage || !imageUrl) {
      return;
    }
    try {
      const filename = this.extractFilenameFromUrl(imageUrl);
      if (!filename) {
        this.logger.warn(`Could not extract filename from URL: ${imageUrl}`);
        return;
      }
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(`avatars/${filename}`);
      const [exists] = await blob.exists();
      if (exists) {
        await blob.delete();
      }
    } catch (error) {
      this.logger.error(`Failed to delete avatar: ${error.message}`);
    }
  }

  private generateFilename(userId: string, extension: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(`${userId}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    return `${userId}-${hash}.${extension}`;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mimeType] || 'jpg';
  }

  private extractFilenameFromUrl(url: string): string | null {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return null;
    }
  }
}
