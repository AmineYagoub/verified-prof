import { Injectable, Logger } from '@nestjs/common';
import { TagDetail, TagSummary } from '@verified-prof/shared';
import crypto from 'crypto';
import path from 'path';
import { SyntaxNode } from 'tree-sitter';

const STATIC_LANGUAGE_MODULES: Record<string, unknown> = {};
STATIC_LANGUAGE_MODULES[
  'tree-sitter-typescript'
] = require('tree-sitter-typescript');
STATIC_LANGUAGE_MODULES[
  'tree-sitter-javascript'
] = require('tree-sitter-javascript');
STATIC_LANGUAGE_MODULES['tree-sitter-python'] = require('tree-sitter-python');

const LANGUAGES_CONFIG = {
  javascript: {
    module: 'tree-sitter-javascript',
    query: `
      (import_statement) @import
      (class_declaration name: (identifier) @class.name) @class.def
      (function_declaration name: (identifier) @func.name) @func.def
      (method_definition name: (property_identifier) @func.name) @func.def
      [(if_statement) (for_statement) (while_statement) (switch_case) (ternary_expression)] @complexity.branch
      (comment) @comment
    `,
  },
  typescript: {
    module: 'tree-sitter-typescript',
    query: `
      (import_statement) @import
      (class_declaration name: (type_identifier) @class.name) @class.def
      (function_declaration name: (identifier) @func.name) @func.def
      (method_definition name: (property_identifier) @func.name) @func.def
      (interface_declaration name: (type_identifier) @class.name) @class.def
      [(if_statement) (for_statement) (while_statement) (switch_case) (ternary_expression)] @complexity.branch
      (comment) @comment
    `,
  },
  python: {
    module: 'tree-sitter-python',
    query: `
      [(import_from_statement) (import_statement)] @import
      (class_definition name: (identifier) @class.name) @class.def
      (function_definition name: (identifier) @func.name) @func.def
      [(if_statement) (for_statement) (while_statement) (with_statement)] @complexity.branch
      (comment) @comment
    `,
  },
  go: {
    module: 'tree-sitter-go',
    query: `
      (import_spec) @import
      (type_declaration (type_spec name: (type_identifier) @class.name)) @class.def
      (function_declaration name: (identifier) @func.name) @func.def
      (method_declaration name: (field_identifier) @func.name) @func.def
      [(if_statement) (for_statement) (communication_case) (select_statement)] @complexity.branch
      (comment) @comment
    `,
  },
  rust: {
    module: 'tree-sitter-rust',
    query: `
      (use_declaration) @import
      [(struct_item name: (type_identifier) @class.name) (enum_item name: (type_identifier) @class.name) (trait_item name: (type_identifier) @class.name)] @class.def
      (function_item name: (identifier) @func.name) @func.def
      (impl_item (function_item name: (identifier) @func.name)) @func.def
      [(if_expression) (for_expression) (while_expression) (match_arm)] @complexity.branch
      (line_comment) @comment
    `,
  },
  swift: {
    module: 'tree-sitter-swift',
    query: `
      (import_declaration) @import
      [(class_declaration name: (type_identifier) @class.name) (struct_declaration name: (type_identifier) @class.name)] @class.def
      (function_declaration name: (identifier) @func.name) @func.def
      [(if_statement) (for_in_statement) (while_statement) (switch_statement)] @complexity.branch
      (comment) @comment
    `,
  },
  php: {
    module: 'tree-sitter-php',
    query: `
      [(namespace_definition) (namespace_use_declaration)] @import
      (class_declaration name: (name) @class.name) @class.def
      (function_definition name: (name) @func.name) @func.def
      (method_declaration name: (name) @func.name) @func.def
      [(if_statement) (for_statement) (foreach_statement) (while_statement) (switch_case)] @complexity.branch
      (comment) @comment
    `,
  },
  kotlin: {
    module: 'tree-sitter-kotlin',
    query: `
      (import_header) @import
      (class_declaration name: (type_identifier) @class.name) @class.def
      (function_declaration name: (simple_identifier) @func.name) @func.def
      [(if_expression) (for_statement) (while_statement) (when_entry)] @complexity.branch
      (comment) @comment
    `,
  },
  zig: {
    module: 'tree-sitter-zig',
    query: `
      (ContainerDecl) @class.def
      (FnProto name: (identifier) @func.name) @func.def
      [(IfPrefix) (ForPrefix) (WhilePrefix)] @complexity.branch
      (line_comment) @comment
    `,
  },
};

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
  /**
   * Map a file extension to a canonical language identifier used by the analyzer.
   *
   * Expects the extension to include the leading dot (for example ".ts").
   * Known mappings include:
   *  - ".js", ".mjs", ".cjs", ".jsx" => "javascript"
   *  - ".ts", ".tsx" => "typescript"
   *  - ".go" => "go"
   *  - ".py" => "python"
   *  - ".rs" => "rust"
   *  - ".swift" => "swift"
   *  - ".zig" => "zig"
   *  - ".kt" => "kotlin"
   *  - ".php" => "php"
   *
   * The lookup is case-sensitive; unrecognized or unlisted extensions return an empty string.
   *
   * @param ext - The file extension (including the leading dot).
   * @returns The corresponding language identifier, or an empty string if unknown.
   */
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

  /**
   * Removes duplicate TagDetail entries from the provided array based on the `name` property.
   * Use name + start index as key to avoid collapsing distinct anonymous functions
   *
   *
   * @param items - Array of TagDetail objects to deduplicate.
   * @returns A new array containing one TagDetail per unique `name`. If a name appears multiple
   * times in `items`, the TagDetail instance from its last occurrence is retained.
   */
  private deduplicate(items: TagDetail[]): TagDetail[] {
    return [
      ...new Map(
        items.map((item) => [`${item.name}:${item.start ?? ''}`, item]),
      ).values(),
    ];
  }

  /**
   * Analyze a source file's text and produce a TagSummary containing syntactic tags and metrics.
   *
   * This method:
   * - Resolves the language from the file extension via mapExtensionToLang and LANGUAGES_CONFIG.
   * - Dynamically imports the Tree-sitter runtime and the configured language module. For TypeScript,
   *   it selects the `.tsx` grammar when the extension is `.tsx`.
   * - Parses the provided content with Tree-sitter and runs a Query (from the language config) to
   *   extract captures.
   * - Interprets specific capture names from the query:
   *   - 'import' -> collected into an imports array
   *   - 'class.name' -> recorded as class TagDetail { name, start, end }
   *   - 'func.name' -> recorded as function TagDetail { name, start, end }
   *   - 'decorator' -> collected into a decorators array
   *   - 'complexity.branch' -> increments branching node count used for complexity
   *   - 'comment' -> counts TODO/FIXME occurrences (case-insensitive)
   * - Deduplicates detected classes and functions with this.deduplicate.
   * - Computes a complexity score as branchingNodes + 0.5 * uniqueFunctions.length and returns the ceiling
   *   of that score as the `complexity` value.
   * - Computes a SHA-256 hex contentHash and sizeBytes (UTF-8 byte length).
   * - Populates metadata with unique decorators, language key, and `isSierCandidate` (true when raw
   *   complexity score > 10 and there is at least one decorator).
   *
   * @remarks
   * - Any dynamic import or parsing failure will propagate as an exception.
   * - The returned shape is TagSummary and includes: filePath, imports, functions, classes, todoCount,
   *   complexity, contentHash, sizeBytes, and metadata.
   *
   * @param filePath - Absolute or relative path to the file being analyzed (used for logging/summary).
   * @param content - File text to parse and analyze.
   * @param sizeLimit - Optional maximum file size in bytes to parse (default: 500kb). Files exceeding this limit are skipped,
   *  and an empty TagSummary with sizeBytes and contentHash is returned.
   * @param parseWarnMs - Optional threshold in milliseconds to log a warning if parsing exceeds this duration (default: 200ms).
   *
   * @returns A Promise that resolves to a TagSummary describing extracted tags and file metrics.
   *
   * @throws {Error} If the file extension does not map to a supported language (e.g., unsupported extension).
   * @throws {Error} If dynamic imports (tree-sitter or language module) or parsing fail.
   *
   */
  async analyzeFile(
    filePath: string,
    content: string,
    sizeLimit = 500 * 1024,
    parseWarnMs = 200,
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
    const langVariantKey =
      langKey === 'typescript' && ext === '.tsx' ? `${langKey}:tsx` : langKey;
    let Language = this.languageCache.get(langVariantKey);
    if (!Language) {
      let langModule = STATIC_LANGUAGE_MODULES[config.module];
      if (!langModule) {
        try {
          langModule = require(config.module);
        } catch (err: unknown) {
          if ((err as NodeJS.ErrnoException)?.code === 'MODULE_NOT_FOUND') {
            try {
              langModule = await import(config.module);
            } catch (impErr) {
              this.logger.error(
                `Failed to load language module ${config.module}`,
                impErr,
              );
              throw impErr;
            }
          } else {
            this.logger.error(
              `Failed to require language module ${config.module}`,
              err as Error,
            );
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
      Language =
        langKey === 'typescript'
          ? ext === '.tsx'
            ? (lm.tsx as unknown)
            : (lm.typescript as unknown)
          : ((lm.default ?? lm) as unknown);
      this.languageCache.set(langVariantKey, Language);
    }

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
        if (name === 'import') {
          imports.push(node.text);
        }
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
        if (name === 'decorator') {
          decorators.push(node.text);
        }
        if (name === 'complexity.branch') {
          branchingNodes++;
        }
        if (name === 'comment' && /TODO|FIXME/gi.test(node.text)) {
          todoCount++;
        }
      }
    }

    const uniqueFunctions = this.deduplicate(functions);
    const complexityScore = branchingNodes + uniqueFunctions.length * 0.5;
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
        isSierCandidate: complexityScore > 15 || decorators.length > 0,
      },
    };
  }
}
