interface EnrichedSkill {
  name: string;
  level: string;
  category: string;
  evidenceCount: number;
  lastUsed: Date;
  firstUsed: Date;
  confidence: number | null;
  recentUsage: number;
  daysAgo: number;
  usageSpanDays: number;
}

export const generateSkillsSummaryPrompt = (enrichedSkills: EnrichedSkill[]) =>
  `Generate a concise programming skills summary (maximum 20 words) for:

${enrichedSkills
  .map(
    (s, i) => `${i + 1}. ${s.name} (${s.level})
   - Skill level: ${s.level}
   - Evidence strength: ${s.evidenceCount} instances
   - Recent activity: ${s.recentUsage} commits in last 100
   - Active usage span: ${s.usageSpanDays} days in analyzed commits
   - Last used: ${s.daysAgo} days ago
   - Detection confidence: ${((s.confidence || 0) * 100).toFixed(0)}%`,
  )
  .join('\n\n')}

STRICT CONSTRAINT: Maximum 20 words total.
Highlight strongest languages and depth of expertise.
Return ONLY the summary text.`;
