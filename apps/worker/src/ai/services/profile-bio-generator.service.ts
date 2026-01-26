import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { GeminiService } from './gemini.service';
import {
  buildBioGenerationPrompt,
  BIO_GENERATION_SCHEMA,
} from '../prompts/profile-prompts';
import {
  PROFILE_EVENTS,
  ProfileDataFetchedEvent,
  BioGeneratedEvent,
} from '@verified-prof/shared';

@Injectable()
export class ProfileBioGeneratorService {
  private readonly logger = new Logger(ProfileBioGeneratorService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(PROFILE_EVENTS.PROFILE_DATA_FETCHED)
  async handleProfileDataFetched(event: ProfileDataFetchedEvent) {
    const { userId, data } = event;

    this.logger.debug(
      `Generating bio for ${data.user.name || data.user.githubUsername} with ${data.skills.length} skills and ${data.achievements.length} achievements`,
    );

    try {
      const prompt = buildBioGenerationPrompt(data);

      const response = await this.gemini.generateJSON<{ bio: string }>(
        prompt,
        BIO_GENERATION_SCHEMA,
      );

      const bio = response.bio || '';

      this.eventEmitter.emit(
        PROFILE_EVENTS.BIO_GENERATED,
        new BioGeneratedEvent(
          userId,
          bio,
          data.skills.map((s) => s.name),
          data.achievements.length,
        ),
      );

      this.logger.log(
        `Bio generated for user ${userId}: ${bio.length} characters`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate bio for user ${userId}: ${error.message}`,
      );
    }
  }
}
