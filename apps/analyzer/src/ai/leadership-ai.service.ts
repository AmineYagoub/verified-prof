import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini-client.service';
import {
  CommitSummary,
  CategorizedCommit,
  createCommitCategorizationPrompt,
} from './prompts/categorize-commits.prompt';
import {
  FileWithMetadata,
  ArchitecturalLayerResult,
  createArchitecturalLayersPrompt,
} from './prompts/architectural-layers.prompt';

@Injectable()
export class LeadershipAiService {
  private readonly logger = new Logger(LeadershipAiService.name);

  constructor(private readonly gemini: GeminiService) {}

  async categorizeCommits(
    commits: CommitSummary[],
  ): Promise<CategorizedCommit[]> {
    if (commits.length === 0) return [];

    const chunkSize = 1000;
    const chunks: CommitSummary[][] = [];

    for (let i = 0; i < commits.length; i += chunkSize) {
      chunks.push(commits.slice(i, i + chunkSize));
    }

    this.logger.log(
      `Categorizing ${commits.length} commits in ${chunks.length} chunk(s)`,
    );

    const allResults: CategorizedCommit[] = [];

    for (const chunk of chunks) {
      try {
        const prompt = createCommitCategorizationPrompt(chunk);
        const categorized = await this.gemini.generateJSON<CategorizedCommit[]>(
          prompt,
          {},
        );

        allResults.push(...categorized);
        this.logger.log(`Categorized ${categorized.length} commits`);
      } catch (error) {
        this.logger.error(
          `Failed to categorize chunk: ${error.message}`,
          error.stack,
        );

        const fallback = chunk.map((c) => ({
          sha: c.sha,
          category: this.inferCategoryFromMessage(c.message),
          confidence: 0.5,
        }));
        allResults.push(...fallback);
      }
    }

    return allResults;
  }

  async groupArchitecturalLayers(
    files: FileWithMetadata[],
  ): Promise<ArchitecturalLayerResult[]> {
    if (files.length === 0) {
      return this.getDefaultLayers();
    }

    try {
      const prompt = createArchitecturalLayersPrompt(files);
      const layers = await this.gemini.generateJSON<ArchitecturalLayerResult[]>(
        prompt,
        {},
      );

      this.logger.log(
        `Grouped ${files.length} files into ${layers.length} layers`,
      );

      return layers;
    } catch (error) {
      this.logger.error(
        `Failed to group architectural layers: ${error.message}`,
        error.stack,
      );
      return this.getDefaultLayers();
    }
  }

  private inferCategoryFromMessage(
    message: string,
  ): CategorizedCommit['category'] {
    const lower = message.toLowerCase();

    if (lower.match(/^(feat|feature):/)) return 'Feature';
    if (lower.match(/^(fix|bug|hotfix):/)) return 'Fix';
    if (lower.match(/^refactor:/)) return 'Refactor';
    if (lower.match(/^test:/)) return 'Test';
    if (lower.match(/^docs?:/)) return 'Documentation';
    if (lower.match(/^(ci|build|deploy|infra):/)) return 'Infrastructure';
    if (lower.match(/^perf:/)) return 'Performance';
    if (lower.match(/^(security|auth):/)) return 'Security';

    if (lower.includes('test')) return 'Test';
    if (lower.includes('fix') || lower.includes('bug')) return 'Fix';
    if (lower.includes('refactor')) return 'Refactor';
    if (lower.includes('doc')) return 'Documentation';
    if (lower.includes('performance') || lower.includes('optimize'))
      return 'Performance';
    if (lower.includes('security') || lower.includes('auth')) return 'Security';

    return 'Feature';
  }

  private getDefaultLayers(): ArchitecturalLayerResult[] {
    return [
      {
        layer: 'Infrastructure Layer',
        description: 'Deployment and DevOps automation',
        fileCount: 0,
      },
      {
        layer: 'Database Layer',
        description: 'Data persistence and schemas',
        fileCount: 0,
      },
      {
        layer: 'Backend API Layer',
        description: 'Server endpoints and routing',
        fileCount: 0,
      },
      {
        layer: 'Business Logic Layer',
        description: 'Core application logic',
        fileCount: 0,
      },
      {
        layer: 'Frontend Layer',
        description: 'Client application components',
        fileCount: 0,
      },
      {
        layer: 'UI/UX Layer',
        description: 'User interface and styling',
        fileCount: 0,
      },
    ];
  }
}
