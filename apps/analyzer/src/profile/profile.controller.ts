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
import { ProfileService } from './services/profile.service';
import {
  auth,
  CoreMetricsApiResponse,
  UserProfileResponse,
} from '@verified-prof/shared';
import { ProfileAvatarService } from './services/avatar.service';
import { ProfileAggregatorService } from './services/profile-aggregator.service';
import { ContextBuilderService } from './services/context-builder.service';
import { GeminiService } from '../ai/services/gemini-client.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly avatarService: ProfileAvatarService,
    private readonly aggregatorService: ProfileAggregatorService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('me')
  async getMyProfile(
    @Session() session: UserSession,
  ): Promise<UserProfileResponse | null> {
    return await this.aggregatorService.getMyProfile(session.user.id);
  }

  @Get(':slug')
  @OptionalAuth()
  async getPublicProfile(
    @Param('slug') slug: string,
  ): Promise<UserProfileResponse> {
    return await this.aggregatorService.getFullProfile(slug);
  }

  @Get(':userId/core-metrics')
  @OptionalAuth()
  async getCoreMetrics(
    @Param('userId') userId: string,
  ): Promise<CoreMetricsApiResponse> {
    return this.profileService.getCoreMetrics(userId);
  }

  @Get(':slug/twin-token')
  @OptionalAuth()
  async getVoiceTwinToken(@Param('slug') slug: string) {
    const profile = await this.aggregatorService.getFullProfile(slug);
    const context = this.contextBuilder.buildVoiceTwinContext(profile);
    const voiceName = this.selectVoiceForProfile(profile);
    const tokenData = await this.geminiService.createEphemeralToken({
      systemInstruction: context,
      temperature: 0.7,
      voiceName,
      thinkingBudget: 2048,
    });
    return { ...tokenData, voiceName, sessionDurationMinutes: 15 };
  }

  @Post(':slug/twin-conversation')
  @OptionalAuth()
  async saveConversation(
    @Param('slug') slug: string,
    @Req()
    req: Request & {
      body: {
        transcript: { speaker: string; text: string }[];
        duration: number;
      };
    },
  ) {
    const { transcript, duration } = req.body;
    const user = await this.profileService.getUserBySlug(slug);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const transcriptText = transcript
      .map((entry) => `[${entry.speaker}]: ${entry.text}`)
      .join('\n\n');

    await this.profileService.saveConversation({
      userId: user.id,
      transcript: transcriptText,
      duration,
      startedAt: new Date(Date.now() - duration * 1000),
      endedAt: new Date(),
    });
    return { success: true };
  }

  private selectVoiceForProfile(profile: UserProfileResponse): string {
    const seniority = profile.coreMetrics?.seniorityRank;
    if (seniority === 'Principal' || seniority === 'Staff') return 'Puck';
    if (seniority === 'Senior') return 'Kore';
    if (seniority === 'Mid') return 'Charon';
    return 'Aoede';
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
