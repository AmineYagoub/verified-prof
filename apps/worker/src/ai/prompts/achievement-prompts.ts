import type { CommitData, PullRequestData } from '@verified-prof/shared';

/**
 * Builds prompt for extracting achievements from a pull request.
 * Focuses on impact, technical depth, and verifiable outcomes.
 */
export const buildAchievementExtractionPrompt = (
  pr: PullRequestData,
  commits: CommitData[],
): string => {
  const commitMessages = commits
    .map((c) => `- ${c.message.split('\n')[0]}`)
    .join('\n');

  return `Analyze this pull request and extract a meaningful achievement if applicable.

PULL REQUEST:
Title: ${pr.title}
Description: ${pr.body || 'No description provided'}
Lines Added: ${pr.additions}
Lines Deleted: ${pr.deletions}
Files Changed: ${pr.changedFiles}
Comments: ${pr.comments}

COMMITS (${commits.length}):
${commitMessages}

EXTRACTION RULES:
1. Only extract if the PR demonstrates meaningful technical work
2. Focus on WHAT was built and WHY it matters
3. Avoid trivial changes (typo fixes, formatting, config tweaks)
4. Emphasize impact: performance gains, new features, bug fixes with scope
5. Keep titles concise (under 80 chars)
6. Descriptions should be 2-3 sentences max

OUTPUT FORMAT (JSON):
{
  "hasAchievement": true/false,
  "title": "Implemented OAuth 2.0 with PKCE for mobile clients",
  "description": "Built secure authentication flow supporting mobile apps. Reduced auth-related security incidents by implementing PKCE extension for public clients.",
  "impact": "high" | "medium" | "low",
  "category": "feature" | "performance" | "bugfix" | "refactor" | "security" | "infrastructure",
  "skills": ["OAuth", "Security", "Mobile APIs"],
  "reasoning": "Why this qualifies as an achievement or why it doesn't"
}

EXAMPLES OF ACHIEVEMENTS:
✅ "Migrated session store from Redis to PostgreSQL" (technical depth)
✅ "Reduced API response time by 40% through query optimization" (measurable impact)
✅ "Implemented GitHub commit quality analyzer with 8 metrics" (scope + complexity)

EXAMPLES OF NON-ACHIEVEMENTS:
❌ "Fixed typo in README"
❌ "Updated dependencies"
❌ "Added comments to code"

Analyze and respond:`;
};

/**
 * Builds prompt for batch achievement extraction from multiple PRs.
 */
export const buildBatchAchievementPrompt = (
  prs: Array<{ pr: PullRequestData; commits: CommitData[] }>,
): string => {
  const prSummaries = prs
    .map(
      (item, idx) =>
        `PR ${idx + 1}: ${item.pr.title}\n  +${item.pr.additions} -${item.pr.deletions} | ${item.commits.length} commits`,
    )
    .join('\n\n');

  return `Review these ${prs.length} pull requests and identify the top achievements.

${prSummaries}

For each PR with a meaningful achievement, extract it using the same format.
Return an array of achievements, or empty array if none qualify.

OUTPUT FORMAT (JSON):
{
  "achievements": [
    {
      "prNumber": 123,
      "title": "...",
      "description": "...",
      "impact": "high" | "medium" | "low",
      "category": "...",
      "skills": [...]
    }
  ]
}`;
};

/**
 * Builds prompt for skill inference from achievements.
 */
export const buildSkillInferencePrompt = (
  achievements: Array<{
    title: string;
    description: string;
    skills: string[];
  }>,
): string => {
  const achievementList = achievements
    .map(
      (a, idx) => `${idx + 1}. ${a.title}\n   Skills: ${a.skills.join(', ')}`,
    )
    .join('\n\n');

  return `Based on these achievements, infer the engineer's skill profile.

ACHIEVEMENTS:
${achievementList}

Extract:
1. Primary skills (mentioned 3+ times or core to multiple achievements)
2. Secondary skills (mentioned 1-2 times)
3. Skill levels based on complexity and frequency
4. Years of experience estimate per skill (be conservative)

OUTPUT FORMAT (JSON):
{
  "skills": [
    {
      "name": "TypeScript",
      "level": "advanced" | "intermediate" | "beginner",
      "evidenceCount": 5,
      "estimatedYears": 3,
      "category": "language" | "framework" | "tool" | "practice"
    }
  ]
}`;
};
