import { Injectable, Logger } from '@nestjs/common';
import TreeSitterYAML from '@tree-sitter-grammars/tree-sitter-yaml';
import { SyntaxNode } from 'tree-sitter';
import TreeSitterGo from 'tree-sitter-go';
import TreeSitterJavaScript from 'tree-sitter-javascript';
import TreeSitterJSON from 'tree-sitter-json';
import TreeSitterPHP from 'tree-sitter-php';
import TreeSitterPython from 'tree-sitter-python';
import TreeSitterRust from 'tree-sitter-rust';
import TreeSitterTypeScript from 'tree-sitter-typescript';
import TreeSitterVue from 'tree-sitter-vue';
import TreeSitterZig from 'tree-sitter-zig';

type ParserConstructor = new () => {
  parse(src: string): { rootNode: SyntaxNode };
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

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'tsx'
  | 'python'
  | 'go'
  | 'rust'
  | 'php'
  | 'zig'
  | 'vue'
  | 'yaml'
  | 'json';

export interface ParsedCode {
  rootNode: SyntaxNode;
  language: SupportedLanguage;
}

export interface QueryMatch {
  name: string;
  node: SyntaxNode;
}

/**
 * Unified Tree-sitter service responsible for:
 * - Managing all tree-sitter language imports
 * - Parsing code with tree-sitter
 * - Executing queries on parsed code
 *
 * This service provides caching for both languages and queries to optimize performance.
 */
@Injectable()
export class TreeSitterService {
  private readonly logger = new Logger(TreeSitterService.name);
  private readonly MAX_CACHE_SIZE = 50;
  private readonly languageCache = new Map<string, unknown>();
  private readonly queryCache = new Map<
    string,
    InstanceType<QueryConstructor>
  >();

  private readonly extensionMap: Record<string, SupportedLanguage> = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.go': 'go',
    '.py': 'python',
    '.rs': 'rust',
    '.php': 'php',
    '.zig': 'zig',
    '.vue': 'vue',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.json': 'json',
  };

  /**
   * Get the tree-sitter Language object for a given language key
   */
  getLanguage(langKey: SupportedLanguage): unknown {
    const cacheKey = langKey;

    if (this.languageCache.has(cacheKey)) {
      return this.languageCache.get(cacheKey);
    }

    const language = this.loadLanguage(langKey);
    this.cacheLanguage(cacheKey, language);
    return language;
  }

  /**
   * Parse code with tree-sitter, returning the syntax tree
   */
  parse(
    content: string,
    filePath: string,
  ): { rootNode: SyntaxNode; language: SupportedLanguage } | null {
    try {
      const ext = filePath.substring(filePath.lastIndexOf('.'));
      const langKey = this.extensionMap[ext as keyof typeof this.extensionMap];

      if (!langKey) {
        return null;
      }

      const ParserModule = require('tree-sitter');
      const Parser = (ParserModule.default ??
        ParserModule) as ParserConstructor;
      const Language = this.getLanguage(langKey);

      const parser = new Parser();
      parser.setLanguage(Language);

      const tree = parser.parse(content);

      return { rootNode: tree.rootNode, language: langKey };
    } catch (error) {
      this.logger.debug(
        `Failed to parse ${filePath} with tree-sitter: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Execute a query on parsed code and return all matches
   */
  query(
    parsedCode: ParsedCode,
    querySource: string,
  ): Array<{ name: string; node: SyntaxNode }> {
    try {
      const ParserModule = require('tree-sitter');
      const QueryCtor = ParserModule.Query as QueryConstructor;

      const queryKey = `${parsedCode.language}:${this.hashString(querySource)}`;
      let query = this.queryCache.get(
        queryKey,
      ) as InstanceType<QueryConstructor>;

      if (!query) {
        const Language = this.getLanguage(parsedCode.language);
        query = new QueryCtor(Language, querySource);
        this.cacheQuery(queryKey, query);
      }

      const matches = query.matches(parsedCode.rootNode);
      const results: Array<{ name: string; node: SyntaxNode }> = [];

      for (const match of matches) {
        for (const capture of match.captures) {
          results.push({ name: capture.name, node: capture.node });
        }
      }

      return results;
    } catch (error) {
      this.logger.debug(`Query execution failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse and query in one operation - convenience method
   */
  parseAndQuery(
    content: string,
    filePath: string,
    querySource: string,
  ): Array<{ name: string; node: SyntaxNode }> {
    const parsed = this.parse(content, filePath);
    if (!parsed) {
      return [];
    }
    return this.query(parsed, querySource);
  }

  /**
   * Map file extension to supported language
   */
  getLanguageFromExtension(ext: string): SupportedLanguage | null {
    return this.extensionMap[ext as keyof typeof this.extensionMap] || null;
  }

  /**
   * Check if a file extension is supported
   */
  isSupported(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return ext in this.extensionMap;
  }

  private loadLanguage(langKey: SupportedLanguage): unknown {
    switch (langKey) {
      case 'javascript':
        return TreeSitterJavaScript;
      case 'typescript':
        return TreeSitterTypeScript.typescript;
      case 'tsx':
        return TreeSitterTypeScript.tsx;
      case 'python':
        return TreeSitterPython;
      case 'go':
        return TreeSitterGo;
      case 'rust':
        return TreeSitterRust;
      case 'php':
        return TreeSitterPHP;
      case 'zig':
        return TreeSitterZig;
      case 'vue':
        return TreeSitterVue;
      case 'yaml':
        return TreeSitterYAML;
      case 'json':
        return TreeSitterJSON;
      default:
        throw new Error(`Unsupported language: ${langKey}`);
    }
  }

  private cacheLanguage(key: string, language: unknown): void {
    if (this.languageCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.languageCache.keys().next().value;
      this.languageCache.delete(firstKey);
    }
    this.languageCache.set(key, language);
  }

  private cacheQuery(key: string, query: InstanceType<QueryConstructor>): void {
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    this.queryCache.set(key, query);
  }

  /**
   * Simple string hash for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
