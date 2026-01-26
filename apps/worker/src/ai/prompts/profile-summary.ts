import type { ActivitySummary } from '@verified-prof/shared';

export const BIO_GENERATION_PROMPT = (
  activitySummary: ActivitySummary,
) => `Generate a professional developer bio based on their GitHub activity.

STRICT CONSTRAINT: Maximum 20 words total. Be extremely concise.

Activity Summary:
- Total Commits: ${activitySummary.totalCommits}
- Total PRs: ${activitySummary.totalPRs}
- File Extensions: ${Object.keys(activitySummary.fileExtensions).slice(0, 5).join(', ')}
- Package Dependencies: ${activitySummary.packageDependencies.slice(0, 3).join(', ')}
- Active Range: ${activitySummary.dateRange.first.toLocaleDateString()} to ${activitySummary.dateRange.last.toLocaleDateString()}

Requirements:
1. Maximum 20 words - count carefully
2. Focus on primary expertise and impact
3. Professional tone, no fluff
4. No generic phrases

Return ONLY the bio text, nothing else.`;

export const SKILLS_SUMMARY_PROMPT = (
  skills: Array<{ name: string; level: string; category: string }>,
) => `Summarize a developer's programming language skills for hiring managers.

STRICT CONSTRAINT: Maximum 20 words total. Be extremely concise.

Skills:
${skills.map((s) => `- ${s.name} (${s.level})`).join('\n')}

Requirements:
1. Maximum 20 words - count carefully
2. Highlight strongest languages and overall expertise
3. Mention years of experience if inferable
4. Professional, direct language

Return ONLY the summary text, nothing else.`;

export const QUALITY_METRICS_SUMMARY_PROMPT = (metrics: {
  overallScore: number;
  disciplineScore: number;
  clarityScore: number;
  impactScore: number;
  consistencyScore: number;
  totalCommitsAnalyzed: number;
}) => `Summarize code quality metrics for hiring managers.

STRICT CONSTRAINT: Maximum 20 words total. Be extremely concise.

Metrics:
- Overall Score: ${metrics.overallScore}/100
- Discipline: ${metrics.disciplineScore}/100
- Clarity: ${metrics.clarityScore}/100
- Impact: ${metrics.impactScore}/100
- Consistency: ${metrics.consistencyScore}/100
- Commits Analyzed: ${metrics.totalCommitsAnalyzed}

Requirements:
1. Maximum 20 words - count carefully
2. Translate scores into hiring-relevant insights
3. Mention standout strengths
4. Professional, positive tone

Return ONLY the summary text, nothing else.`;
