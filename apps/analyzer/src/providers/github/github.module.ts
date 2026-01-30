import { Module } from '@nestjs/common';
import { GitHubVcsProvider } from './github-vcs.provider';

@Module({
  providers: [GitHubVcsProvider],
  exports: [GitHubVcsProvider],
})
export class GitHubModule {}
