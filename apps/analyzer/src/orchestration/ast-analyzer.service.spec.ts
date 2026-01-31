import { jest } from '@jest/globals';

// Mocks must be defined before importing the service because the service does dynamic imports
let matchesImpl: (node: unknown) => Array<unknown> = () => [];

class ParserMock {
  setLanguage(lang: unknown) {
    void lang;
  }
  parse(src: string) {
    void src;
    return { rootNode: {} };
  }
}

class QueryMock {
  constructor(language: unknown, source: string) {
    void language;
    void source;
  }
  matches(node: unknown) {
    return matchesImpl(node);
  }
}

// Mock tree-sitter and language modules
jest.mock('tree-sitter', () => ({
  default: ParserMock,
  Query: QueryMock,
}));

jest.mock('tree-sitter-javascript', () => ({ default: {} }));
jest.mock('tree-sitter-typescript', () => ({ typescript: {}, tsx: {} }));
jest.mock('tree-sitter-python', () => ({ default: {} }));

import { AstAnalyzerService } from './ast-analyzer.service';

describe('AstAnalyzerService (orchestration)', () => {
  let svc: AstAnalyzerService;

  beforeEach(() => {
    svc = new AstAnalyzerService();
    matchesImpl = () => [];
  });

  test('extracts imports/functions/classes/todos/complexity', async () => {
    matchesImpl = () => [
      { captures: [{ name: 'import', node: { text: "import x from 'mod'" } }] },
      {
        captures: [
          {
            name: 'class.name',
            node: { text: 'MyClass', startIndex: 10, endIndex: 50 },
          },
        ],
      },
      {
        captures: [
          {
            name: 'func.name',
            node: { text: 'foo', startIndex: 60, endIndex: 80 },
          },
        ],
      },
      { captures: [{ name: 'comment', node: { text: 'TODO: fix this' } }] },
      { captures: [{ name: 'complexity.branch', node: {} }] },
    ];

    const summary = await svc.analyzeFile(
      'file.js',
      'const a = 1;\nconsole.log(a);',
    );

    expect(summary.imports).toContain("import x from 'mod'");
    expect(summary.classes.length).toBe(1);
    expect(summary.functions.length).toBe(1);
    expect(summary.todoCount).toBe(1);
    expect(summary.complexity).toBe(Math.ceil(1 + 1 * 0.5));
  });

  test('preserves multiple anonymous functions (unique by start index)', async () => {
    matchesImpl = () => [
      {
        captures: [
          {
            name: 'func.name',
            node: { text: '<anonymous>', startIndex: 10, endIndex: 20 },
          },
        ],
      },
      {
        captures: [
          {
            name: 'func.name',
            node: { text: '<anonymous>', startIndex: 30, endIndex: 40 },
          },
        ],
      },
    ];

    const summary = await svc.analyzeFile('file.ts', 'function(){}');

    expect(summary.functions.length).toBe(2);
  });

  test('skips large files and returns minimal summary', async () => {
    const big = 'a'.repeat(600 * 1024); // 600KB
    const summary = await svc.analyzeFile('big.ts', big);

    expect(summary.sizeBytes).toBeGreaterThan(500 * 1024);
    expect(summary.imports).toEqual([]);
    expect(summary.functions).toEqual([]);
    expect(summary.classes).toEqual([]);
  });
});
