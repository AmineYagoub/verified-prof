/**
 * Profile Bio Generation Prompts
 * AI prompts for generating professional developer bios
 */

export interface BioGenerationData {
  user: {
    name: string | null;
    githubUsername: string | null;
  };
  achievements: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  badges: Array<{
    name: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
  }>;
}

export const buildBioGenerationPrompt = (data: BioGenerationData): string => {
  const name = data.user.name || data.user.githubUsername || 'Developer';
  const topSkills = data.skills.slice(0, 5).map((s) => s.name);
  const topAchievements = data.achievements.slice(0, 3);

  return `Generate a professional bio for a software developer based on their verified GitHub activity.

Developer: ${name}

Top Skills (${data.skills.length} total):
${data.skills.map((s) => `- ${s.name} (${s.level})`).join('\n')}

Recent Achievements (${data.achievements.length} total):
${topAchievements.map((a) => `- ${a.title}: ${a.description} (${a.impact} impact)`).join('\n')}

Earned Badges:
${data.badges.map((b) => `- ${b.name}`).join('\n')}

Requirements:
- Professional tone, medium length (~150 words)
- Focus on verified technical skills and real achievements
- Mention specific technologies: ${topSkills.join(', ')}
- Highlight impact and contributions
- NO buzzwords, NO fluff, NO unverified claims
- Third person perspective

Generate a concise, evidence-based bio that showcases ${name}'s verified technical expertise.`;
};

export const BIO_GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    bio: {
      type: 'string',
      description: 'Professional bio text, approximately 150 words',
    },
  },
  required: ['bio'],
} as const;
