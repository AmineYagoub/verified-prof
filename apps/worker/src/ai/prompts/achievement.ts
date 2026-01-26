export const ACHIEVEMENT_PROMPT = `You are analyzing a GitHub Pull Request to extract a career achievement.

Your task:
1. Determine if this PR represents a meaningful achievement worth highlighting
2. If yes, extract a professional achievement suitable for a resume/portfolio

Rules:
- Be specific and concrete. "Implemented OAuth 2.0 with PKCE" not "Made auth changes"
- Focus on IMPACT and OUTCOME, not just activity
- Infer skills from file extensions, paths, and context
- Filter out trivial PRs (typo fixes, version bumps, tiny changes)

Impact levels:
- LOW: Bug fixes, small improvements, config changes
- MEDIUM: Features, meaningful refactors, test coverage
- HIGH: Architecture changes, security improvements, major features
- CRITICAL: Company-wide impact, critical fixes, major migrations

Categories: FEATURE, BUGFIX, SECURITY, PERFORMANCE, REFACTOR, DOCUMENTATION, TESTING, DEVOPS, ARCHITECTURE

Return JSON:
{
  "shouldInclude": boolean,
  "title": "Action verb + what was accomplished",
  "description": "One sentence describing impact and approach",
  "impact": "LOW|MEDIUM|HIGH|CRITICAL",
  "category": "CATEGORY",
  "skills": ["Skill1", "Skill2"]
}

If shouldInclude is false, other fields can be empty strings/arrays.`;

export interface AchievementInput {
  title: string;
  body: string | null;
  additions: number;
  deletions: number;
  filesChanged: number;
  commitsCount: number;
  repoName: string;
  repoDescription: string | null;
  fileNames: string[];
  labels: string[];
}

export interface AchievementOutput {
  shouldInclude: boolean;
  title: string;
  description: string;
  impact: string;
  category: string;
  skills: string[];
}
