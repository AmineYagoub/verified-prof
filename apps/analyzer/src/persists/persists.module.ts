import { Module } from '@nestjs/common';
import { PersistsService } from './persists.service';
import { DbModule } from '@verified-prof/prisma';
import { ProvidersModule } from '../providers/providers.module';
import { GitHubModule } from '../providers/github/github.module';
import { GitHubCollaborationService } from '../providers/github/github-collaboration.service';

@Module({
  imports: [DbModule, ProvidersModule, GitHubModule],
  providers: [PersistsService, GitHubCollaborationService],
  exports: [PersistsService],
})
export class PersistsModule {}
