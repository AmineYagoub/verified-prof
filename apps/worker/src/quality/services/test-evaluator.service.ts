import { Injectable } from '@nestjs/common';
import type { CommitData } from '@verified-prof/shared';

export interface TestEvidenceResult {
  score: number;
  hasTests: boolean;
  testFileCount: number;
  codeFileCount: number;
  testToCodeRatio: number;
  violations: string[];
  detectedPatterns: string[];
}

export interface DomainTestThresholds {
  minTestRatio: number;
  minTestFileSize: number;
  name: string;
}

@Injectable()
export class TestEvaluatorService {
  private readonly TEST_FILE_PATTERNS = [
    /\.spec\.ts$/,
    /\.test\.ts$/,
    /\.spec\.js$/,
    /\.test\.js$/,
    /\.spec\.tsx$/,
    /\.test\.tsx$/,
    /__tests__\//,
    /\.test\./,
    /\.spec\./,
  ];

  private readonly TEST_KEYWORDS = [
    'describe',
    'it(',
    'test(',
    'expect(',
    'assert',
    'should',
    'beforeEach',
    'afterEach',
  ];

  /**
   * Evaluates test evidence in a commit.
   * Detects test files, calculates test-to-code ratio, validates quality.
   */
  evaluateTestEvidence(
    commit: CommitData,
    thresholds: DomainTestThresholds,
  ): TestEvidenceResult {
    const files = commit.changedFiles || [];
    const testFiles = files.filter((file) => this.isTestFile(file.filename));
    const codeFiles = files.filter(
      (file) =>
        !this.isTestFile(file.filename) && this.isCodeFile(file.filename),
    );

    const testFileCount = testFiles.length;
    const codeFileCount = codeFiles.length;
    const hasTests = testFileCount > 0;
    const testToCodeRatio =
      codeFileCount > 0 ? testFileCount / codeFileCount : 0;

    const violations: string[] = [];
    const detectedPatterns: string[] = [];

    if (codeFileCount > 0 && testFileCount === 0) {
      violations.push('no_tests_for_code_changes');
    }

    if (testToCodeRatio < thresholds.minTestRatio && codeFileCount > 0) {
      violations.push('insufficient_test_coverage');
    }

    testFiles.forEach((file) => {
      if (file.additions && file.additions < thresholds.minTestFileSize) {
        violations.push('test_file_too_small');
      }
    });

    if (hasTests) {
      detectedPatterns.push('has_test_files');
    }

    const score = this.calculateTestScore(
      hasTests,
      testToCodeRatio,
      testFileCount,
      violations,
      thresholds,
    );

    return {
      score,
      hasTests,
      testFileCount,
      codeFileCount,
      testToCodeRatio,
      violations,
      detectedPatterns,
    };
  }

  /**
   * Checks if a filename matches test file patterns.
   */
  isTestFile(filename: string): boolean {
    return this.TEST_FILE_PATTERNS.some((pattern) => pattern.test(filename));
  }

  /**
   * Checks if a filename is a code file (not config, docs, etc).
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.ts',
      '.js',
      '.tsx',
      '.jsx',
      '.py',
      '.java',
      '.go',
      '.rs',
    ];
    const excludePatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /\.config\./,
      /\.md$/,
      /\.txt$/,
      /\.yaml$/,
      /\.yml$/,
    ];

    if (excludePatterns.some((pattern) => pattern.test(filename))) {
      return false;
    }

    return codeExtensions.some((ext) => filename.endsWith(ext));
  }

  /**
   * Calculates test score based on evidence and thresholds.
   */
  private calculateTestScore(
    hasTests: boolean,
    testToCodeRatio: number,
    testFileCount: number,
    violations: string[],
    thresholds: DomainTestThresholds,
  ): number {
    if (!hasTests) {
      return 0;
    }

    let score = 50;

    if (testToCodeRatio >= thresholds.minTestRatio) {
      score += 30;
    } else {
      score += Math.round((testToCodeRatio / thresholds.minTestRatio) * 30);
    }

    if (testFileCount > 0) {
      score += Math.min(20, testFileCount * 5);
    }

    const violationPenalty = violations.length * 10;
    score = Math.max(0, score - violationPenalty);

    return Math.min(100, score);
  }

  /**
   * Determines domain-specific test thresholds.
   */
  getDomainThresholds(domain: string): DomainTestThresholds {
    const thresholds: Record<string, DomainTestThresholds> = {
      backend: {
        name: 'backend',
        minTestRatio: 0.8,
        minTestFileSize: 10,
      },
      frontend: {
        name: 'frontend',
        minTestRatio: 0.7,
        minTestFileSize: 8,
      },
      ml: {
        name: 'ml',
        minTestRatio: 0.6,
        minTestFileSize: 5,
      },
      devops: {
        name: 'devops',
        minTestRatio: 0.5,
        minTestFileSize: 5,
      },
    };

    return thresholds[domain] || thresholds['backend'];
  }

  /**
   * Analyzes test quality based on file content patterns.
   */
  analyzeTestQuality(testFileContent: string): {
    hasDescribe: boolean;
    hasExpect: boolean;
    hasAssertions: boolean;
    qualityScore: number;
  } {
    const hasDescribe = /describe\(/.test(testFileContent);
    const hasExpect = /expect\(/.test(testFileContent);
    const hasAssertions = /assert/.test(testFileContent);

    let qualityScore = 0;
    if (hasDescribe) qualityScore += 30;
    if (hasExpect || hasAssertions) qualityScore += 50;
    if (testFileContent.length > 100) qualityScore += 20;

    return {
      hasDescribe,
      hasExpect,
      hasAssertions,
      qualityScore: Math.min(100, qualityScore),
    };
  }
}
