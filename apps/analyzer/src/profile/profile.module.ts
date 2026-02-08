import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { ProfileController } from './profile.controller';
import { ProfileService } from './services/profile.service';
import { ProfileAvatarService } from './services/avatar.service';
import { ProfileAggregatorService } from './services/profile-aggregator.service';
import { ContextBuilderService } from './services/context-builder.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DbModule, AiModule],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileAvatarService,
    ProfileAggregatorService,
    ContextBuilderService,
  ],
  exports: [ProfileService, ProfileAggregatorService, ContextBuilderService],
})
export class ProfileModule {}
