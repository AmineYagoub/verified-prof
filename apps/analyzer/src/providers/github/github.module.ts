import { Module } from '@nestjs/common';
import { GitHubVcsProvider } from './github-vcs.provider';
import { GitHubCollaborationService } from './github-collaboration.service';

@Module({
  providers: [GitHubVcsProvider, GitHubCollaborationService],
  exports: [GitHubVcsProvider],
})
export class GitHubModule {}
