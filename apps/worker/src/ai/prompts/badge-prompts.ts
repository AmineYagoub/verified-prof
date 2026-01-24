/**
 * Badge Prompts
 * AI prompts for generating personalized badge descriptions
 */

interface BadgeCriteria {
  name: string;
  description: string;
  requirements: Array<{ description: string }>;
}

interface UserMetrics {
  totalCommits: number;
  commitsLast90Days: number;
  avgQualityScore: number;
  consecutiveDays: number;
  achievementCounts: Record<string, number>;
}

export const buildBadgeDescriptionPrompt = (
  type: string,
  criteria: BadgeCriteria,
  metrics: UserMetrics,
): string => {
  return `Generate a personalized, professional badge description for a developer profile.

Badge Type: ${type}
Badge Name: ${criteria.name}
Default Description: ${criteria.description}

Developer Metrics:
- Total commits: ${metrics.totalCommits}
- Commits in last 90 days: ${metrics.commitsLast90Days}
- Average quality score: ${metrics.avgQualityScore.toFixed(1)}/100
- Consecutive days streak: ${metrics.consecutiveDays}
- Achievement breakdown: ${JSON.stringify(metrics.achievementCounts)}

Requirements Met:
${criteria.requirements.map((r) => `- ${r.description}`).join('\n')}

Generate a personalized 1-2 sentence description that:
1. Acknowledges their specific accomplishments
2. Uses professional language suitable for a LinkedIn-style profile
3. Highlights what makes this achievement notable
4. Avoids generic phrases like "demonstrates" or "shows dedication"

Return JSON:
{
  "description": "Your personalized badge description here"
}`;
};
