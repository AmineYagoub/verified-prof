export const PROFILE_SUMMARY_PROMPT = (userData: {
  achievements: Array<{ title: string; description: string; category: string }>;
  badges: Array<{ name: string; description: string }>;
  skills: Array<{ name: string; level: string }>;
  activitySummary: {
    totalPRs: number;
    totalCommits: number;
    dateRange: { first: Date; last: Date };
  };
}) => `You are writing a professional profile summary for a developer based on their GitHub activity.

User's GitHub Data:
${JSON.stringify(userData, null, 2)}

Your task:
1. Write a compelling 2-3 sentence professional bio
2. Identify 3-5 key achievement highlights that showcase their strengths

Bio Guidelines:
- Write in third person ("He/She/They is a...")
- Focus on their expertise and impact
- Mention key technologies they work with
- Keep it professional but engaging

Highlight Guidelines:
- Each highlight should be a concise, impactful title
- Focus on diverse strengths (not all from one category)
- Emphasize measurable achievements
- Make them resume-ready

Return JSON:
{
  "bio": "2-3 sentence professional bio",
  "highlights": ["Achievement highlight 1", "Achievement highlight 2", "Achievement highlight 3", "Achievement highlight 4", "Achievement highlight 5"]
}`;

export interface ProfileSummaryOutput {
  bio: string;
  highlights: string[];
}
