export const generateQualityMetricsSummaryPrompt = (data: {
  avgOverall: string;
  avgDiscipline: string;
  disciplinedPct: string;
  avgClarity: string;
  clearPct: string;
  avgImpact: string;
  impactfulPct: string;
  avgConsistency: string;
  consistentPct: string;
  antiPatternPct: string;
  avgSuspicion: string;
  badgeLevel: string | null;
  qualityMetricsLength: number;
  totalAchievements: number;
  totalSkills: number;
}) =>
  `Generate a hiring-focused code quality summary (maximum 20 words) based on:

Quality Scores (0-100):
- Overall Quality: ${data.avgOverall}
- Discipline: ${data.avgDiscipline} (${data.disciplinedPct}% disciplined commits)
- Clarity: ${data.avgClarity} (${data.clearPct}% clear commits)
- Impact: ${data.avgImpact} (${data.impactfulPct}% impactful commits)
- Consistency: ${data.avgConsistency} (${data.consistentPct}% consistent commits)

Integrity:
- Gaming Detection: ${data.antiPatternPct}% flagged
- Suspicion Score: ${data.avgSuspicion}/100

Context:
- Badge Level: ${data.badgeLevel || 'Developing'}
- Analyzed Commits: ${data.qualityMetricsLength}
- Achievements: ${data.totalAchievements}
- Skills Mastered: ${data.totalSkills}

STRICT CONSTRAINT: Maximum 20 words total. Be extremely concise.
Translate technical scores into hiring insights (reliability, code quality, professionalism).
Return ONLY the summary text.`;
