export type CommitCategory =
  | 'Feature'
  | 'Fix'
  | 'Refactor'
  | 'Test'
  | 'Documentation'
  | 'Infrastructure'
  | 'Performance'
  | 'Security';

export interface CommitSummary {
  sha: string;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
}

export interface CategorizedCommit {
  sha: string;
  category: CommitCategory;
  confidence: number;
}

export const createCommitCategorizationPrompt = (
  commits: CommitSummary[],
): string => {
  return `You are an expert at analyzing git commits and categorizing engineering work.

Analyze these commits and categorize each one into ONE of these categories:
- Feature: New functionality, user-facing features, new capabilities
- Fix: Bug fixes, error corrections, hotfixes
- Refactor: Code restructuring, cleaning, optimization without changing behavior
- Test: Adding/updating tests, test infrastructure
- Documentation: README, comments, docs, guides
- Infrastructure: CI/CD, Docker, deployment, build config
- Performance: Speed improvements, optimization, caching
- Security: Security patches, authentication, authorization, vulnerability fixes

Commits to analyze:
${commits
  .map(
    (c, i) => `${i + 1}. SHA: ${c.sha.substring(0, 7)}
   Message: "${c.message}"
   Files: ${c.files.slice(0, 3).join(', ')}${c.files.length > 3 ? ` (+${c.files.length - 3} more)` : ''}
   Changes: +${c.additions}/-${c.deletions}`,
  )
  .join('\n\n')}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  { "sha": "abc1234", "category": "Feature", "confidence": 0.95 },
  { "sha": "def5678", "category": "Fix", "confidence": 0.87 }
]

Rules:
- If message starts with "feat:", "feature:", categorize as Feature
- If message starts with "fix:", "bug:", categorize as Fix
- If message starts with "refactor:", categorize as Refactor
- If message starts with "test:", categorize as Test
- If message starts with "docs:", categorize as Documentation
- If message starts with "ci:", "build:", "deploy:", categorize as Infrastructure
- If message starts with "perf:", categorize as Performance
- If message starts with "security:", "auth:", categorize as Security
- For ambiguous commits, use file paths and change size to infer category
- Set confidence 0.9+ for clear conventional commits, 0.5-0.8 for inferred

Return the JSON array now:`;
};
