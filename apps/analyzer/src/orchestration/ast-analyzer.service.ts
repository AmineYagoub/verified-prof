import { Injectable, Logger } from '@nestjs/common';
import { TagDetail, TagSummary } from '@verified-prof/shared';
import crypto from 'crypto';
import path from 'path';
import { TreeSitterService } from './tree-sitter.service';
import { LANGUAGES_CONFIG } from './ast-analyzer.constants';

@Injectable()
export class AstAnalyzerService {
  private readonly logger = new Logger(AstAnalyzerService.name);
  private readonly DEFAULT_SIZE_LIMIT = 500 * 1024;
  private readonly PARSE_WARN_THRESHOLD_MS = 200;
  private readonly COMPLEXITY_S_TIER_THRESHOLD = 15;
  private readonly FUNCTION_COMPLEXITY_WEIGHT = 0.5;

  constructor(private readonly treeSitter: TreeSitterService) {}

  async analyzeFile(
    filePath: string,
    content: string,
    sizeLimit = this.DEFAULT_SIZE_LIMIT,
    parseWarnMs = this.PARSE_WARN_THRESHOLD_MS,
  ): Promise<TagSummary> {
    const ext = path.extname(filePath).toLowerCase();
    const langKey = this.treeSitter.getLanguageFromExtension(ext);

    const sizeBytes = Buffer.byteLength(content, 'utf8');
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    if (!langKey) {
      this.logger.debug(
        `Skipping AST parsing for ${filePath} (extension: ${ext}) — language not supported`,
      );
      return this.getEmptySummary(filePath, contentHash, sizeBytes, ext.slice(1));
    }

    const config = LANGUAGES_CONFIG[langKey];
    if (!config) {
      return this.getEmptySummary(filePath, contentHash, sizeBytes, langKey);
    }

    if (sizeBytes > sizeLimit) {
      this.logger.warn(
        `Skipping parsing for ${filePath} (size=${sizeBytes} bytes) — exceeds limit ${sizeLimit}`,
      );
      return {
        filePath,
        imports: [],
        functions: [],
        classes: [],
        todoCount: 0,
        complexity: 0,
        contentHash,
        sizeBytes,
        metadata: { decorators: [], language: langKey, isSierCandidate: false },
      };
    }

    const startMs = Date.now();
    const parsed = this.treeSitter.parse(content, filePath);

    if (!parsed) {
      return this.getEmptySummary(filePath, contentHash, sizeBytes, langKey);
    }

    const durationMs = Date.now() - startMs;
    if (durationMs > parseWarnMs) {
      this.logger.warn(`Parsing ${filePath} took ${durationMs}ms`);
    }

    const matches = this.treeSitter.query(parsed, config.query);

    const imports: string[] = [];
    const functions: TagDetail[] = [];
    const classes: TagDetail[] = [];
    const decorators: string[] = [];
    let branchingNodes = 0;
    let todoCount = 0;

    for (const match of matches) {
      if (match.name === 'import') imports.push(match.node.text);
      if (match.name === 'class.name') {
        classes.push({
          name: match.node.text,
          start: match.node.startIndex,
          end: match.node.endIndex,
        });
      }
      if (match.name === 'func.name') {
        functions.push({
          name: match.node.text,
          start: match.node.startIndex,
          end: match.node.endIndex,
        });
      }
      if (match.name === 'decorator') decorators.push(match.node.text);
      if (match.name === 'complexity.branch') branchingNodes++;
      if (match.name === 'comment' && /TODO|FIXME/gi.test(match.node.text)) todoCount++;
    }

    const uniqueFunctions = this.deduplicate(functions);
    const complexityScore =
      branchingNodes + uniqueFunctions.length * this.FUNCTION_COMPLEXITY_WEIGHT;

    return {
      filePath,
      imports: [...new Set(imports)],
      functions: uniqueFunctions,
      classes: this.deduplicate(classes),
      todoCount,
      complexity: Math.ceil(complexityScore),
      contentHash,
      sizeBytes,
      metadata: {
        decorators: [...new Set(decorators)],
        language: langKey,
        isSierCandidate:
          complexityScore > this.COMPLEXITY_S_TIER_THRESHOLD ||
          decorators.length > 0,
      },
    };
  }

  private deduplicate(items: TagDetail[]): TagDetail[] {
    return [
      ...new Map(
        items.map((item) => [
          `${item.name}:${item.start ?? ''}:${item.end ?? ''}`,
          item,
        ]),
      ).values(),
    ];
  }

  private getEmptySummary(
    filePath: string,
    contentHash: string,
    sizeBytes: number,
    language: string,
  ): TagSummary {
    return {
      filePath,
      contentHash,
      sizeBytes,
      classes: [],
      functions: [],
      imports: [],
      todoCount: 0,
      complexity: 0,
      metadata: {
        language,
        decorators: [],
        isSierCandidate: false,
      },
    };
  }
}
