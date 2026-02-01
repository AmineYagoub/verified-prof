import { Injectable, Logger } from '@nestjs/common';
import { TagDetail, TagSummary } from '@verified-prof/shared';
import crypto from 'crypto';
import path from 'path';
import { SyntaxNode } from 'tree-sitter';
import {
  LANGUAGES_CONFIG,
  STATIC_LANGUAGE_MODULES,
} from './ast-analyzer.constants';

type ParserConstructor = new () => {
  parse(src: string): {
    rootNode: SyntaxNode;
  };
  setLanguage(lang: unknown): void;
};

type QueryConstructor = new (
  language: unknown,
  source: string,
) => {
  matches(
    node: SyntaxNode,
  ): Array<{ captures: Array<{ node: SyntaxNode; name: string }> }>;
};

@Injectable()
export class AstAnalyzerService {
  private readonly logger = new Logger(AstAnalyzerService.name);
  private readonly languageCache = new Map<string, unknown>();
  private readonly queryCache = new Map<string, unknown>();
  private readonly DEFAULT_SIZE_LIMIT = 500 * 1024;
  private readonly PARSE_WARN_THRESHOLD_MS = 200;
  private readonly COMPLEXITY_S_TIER_THRESHOLD = 15;
  private readonly FUNCTION_COMPLEXITY_WEIGHT = 0.5;

  private mapExtensionToLang(ext: string): string {
    const extensionMap: Record<string, string> = {
      '.js': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.go': 'go',
      '.py': 'python',
      '.rs': 'rust',
      '.swift': 'swift',
      '.zig': 'zig',
      '.kt': 'kotlin',
      '.php': 'php',
    };
    return extensionMap[ext] ?? '';
  }

  private deduplicate(items: TagDetail[]): TagDetail[] {
    return [
      ...new Map(
        items.map((item) => [`${item.name}:${item.start ?? ''}`, item]),
      ).values(),
    ];
  }

  private async getLanguage(
    langKey: string,
    ext: string,
    moduleName: string,
  ): Promise<unknown> {
    const langVariantKey =
      langKey === 'typescript' && ext === '.tsx' ? `${langKey}:tsx` : langKey;

    if (this.languageCache.has(langVariantKey)) {
      return this.languageCache.get(langVariantKey);
    }

    let langModule = STATIC_LANGUAGE_MODULES[moduleName];
    if (!langModule) {
      try {
        langModule = require(moduleName);
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException)?.code === 'MODULE_NOT_FOUND') {
          langModule = await import(moduleName);
        } else {
          throw err;
        }
      }
    }

    const lm = langModule as {
      default?: unknown;
      tsx?: unknown;
      typescript?: unknown;
      [k: string]: unknown;
    };

    const Language =
      langKey === 'typescript'
        ? ext === '.tsx'
          ? lm.tsx
          : lm.typescript
        : (lm.default ?? lm);

    this.languageCache.set(langVariantKey, Language);
    return Language;
  }

  async analyzeFile(
    filePath: string,
    content: string,
    sizeLimit = this.DEFAULT_SIZE_LIMIT,
    parseWarnMs = this.PARSE_WARN_THRESHOLD_MS,
  ): Promise<TagSummary> {
    const ext = path.extname(filePath).toLowerCase();
    const langKey = this.mapExtensionToLang(ext);
    const config = LANGUAGES_CONFIG[langKey];

    if (!config) {
      throw new Error(`Language not supported for extension: ${ext}`);
    }

    const sizeBytes = Buffer.byteLength(content, 'utf8');
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

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

    const ParserModule = require('tree-sitter');
    const Parser = (ParserModule.default ?? ParserModule) as ParserConstructor;
    const Language = await this.getLanguage(langKey, ext, config.module);

    const parser = new Parser();
    parser.setLanguage(Language);

    let tree: { rootNode: SyntaxNode };
    const startMs = Date.now();
    try {
      tree = parser.parse(content);
    } catch (err) {
      this.logger.error(`Failed to parse ${filePath} (size=${sizeBytes})`, err);
      throw err;
    }

    const durationMs = Date.now() - startMs;
    if (durationMs > parseWarnMs) {
      this.logger.warn(`Parsing ${filePath} took ${durationMs}ms`);
    }

    const QueryCtor = ParserModule.Query as QueryConstructor;
    const langVariantKey =
      langKey === 'typescript' && ext === '.tsx' ? `${langKey}:tsx` : langKey;
    let query = this.queryCache.get(langVariantKey) as
      | InstanceType<QueryConstructor>
      | undefined;

    if (!query) {
      query = new QueryCtor(Language, config.query);
      this.queryCache.set(langVariantKey, query);
    }

    const matches = query.matches(tree.rootNode);
    const imports: string[] = [];
    const functions: TagDetail[] = [];
    const classes: TagDetail[] = [];
    const decorators: string[] = [];
    let branchingNodes = 0;
    let todoCount = 0;

    for (const match of matches) {
      for (const capture of match.captures) {
        const node = capture.node;
        const name = capture.name;

        if (name === 'import') imports.push(node.text);
        if (name === 'class.name') {
          classes.push({
            name: node.text,
            start: node.startIndex,
            end: node.endIndex,
          });
        }
        if (name === 'func.name') {
          functions.push({
            name: node.text,
            start: node.startIndex,
            end: node.endIndex,
          });
        }
        if (name === 'decorator') decorators.push(node.text);
        if (name === 'complexity.branch') branchingNodes++;
        if (name === 'comment' && /TODO|FIXME/gi.test(node.text)) todoCount++;
      }
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
}
