import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileAvatarService } from './avatar.service';

@Module({
  imports: [DbModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileAvatarService],
  exports: [ProfileService],
})
export class ProfileModule {}
