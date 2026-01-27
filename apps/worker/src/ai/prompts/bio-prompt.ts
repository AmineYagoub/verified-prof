export const generateBioPrompt = (data: {
  topLanguages: string;
  topFrameworks: string;
  totalSkills: number;
  accountYears: number;
  totalCommits: number;
  languagesUsed: string[];
  publicRepoCount: number;
  avgQuality: string;
  badgeLevel: string | null;
  sanitizedAchievements: string;
  totalAchievements: number;
}) =>
  `Generate a professional developer bio (maximum 20 words) for a GitHub user with these details:

Core Skills:
- Top Languages: ${data.topLanguages || 'Full-stack developer'}
- Frameworks: ${data.topFrameworks || 'Various'}
- Total Skills: ${data.totalSkills}

Activity & Quality:
- Account Age: ${data.accountYears} years
- Analyzed Commits: ${data.totalCommits}
- Unique Languages: ${data.languagesUsed.slice(0, 5).join(', ')}
- Public Repositories: ${data.publicRepoCount}
- Avg Quality Score: ${data.avgQuality}/100
- Badge Level: ${data.badgeLevel || 'Developing'}

Top Achievements: ${data.sanitizedAchievements}
Total Achievements: ${data.totalAchievements}

STRICT CONSTRAINT: Maximum 20 words total. Be extremely concise.
Focus on strongest expertise and measurable impact.
Return ONLY the bio text, no other content.`;
