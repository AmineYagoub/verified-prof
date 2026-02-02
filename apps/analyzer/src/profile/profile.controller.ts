import {
  Controller,
  Get,
  Param,
  Logger,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { auth, CoreMetricsApiResponse } from '@verified-prof/shared';
import { ProfileAvatarService } from './avatar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly avatarService: ProfileAvatarService,
  ) {}

  @Get(':userId/core-metrics')
  async getCoreMetrics(
    @Param('userId') userId: string,
  ): Promise<CoreMetricsApiResponse> {
    return this.profileService.getCoreMetrics(userId);
  }

  @Get('me')
  async getCurrentUserProfile(@Session() session: UserSession) {
    return await this.profileService.getProfileByUserId(session.user.id);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Session() session: UserSession,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const result = await this.avatarService.uploadAvatar(
        session.user.id,
        file.buffer,
        file.mimetype,
      );
      await auth.api.updateUser({
        headers: req.headers,
        body: {
          image: result.url,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to update user image: ${error.message}`);
    }
  }

  @Delete('avatar')
  async deleteAvatar(@Session() session: UserSession, @Req() req: Request) {
    try {
      await this.avatarService.deleteAvatar(session.user.id);
      await auth.api.updateUser({
        headers: req.headers,
        body: {
          image: null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update user image: ${error.message}`);
    }

    return { success: true };
  }
}
