import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { GitHubModule } from './github/github.module';
import { VcsProviderFactory } from './vcs-provider.factory';

@Module({
  imports: [DbModule, GitHubModule],
  providers: [VcsProviderFactory],
  exports: [VcsProviderFactory],
})
export class ProvidersModule {}
