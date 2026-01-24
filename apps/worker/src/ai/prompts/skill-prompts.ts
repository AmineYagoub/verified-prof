/**
 * Skill Prompts
 * AI prompts for skill validation and assessment
 */

interface SkillData {
  name: string;
  category: string;
  level: string;
  evidenceCount: number;
  firstUsed: Date;
  lastUsed: Date;
  confidence: number | null;
  evidence: Array<{
    evidenceType: string;
    resourceUrl: string;
    occurredAt: Date;
  }>;
}

export const buildSkillValidationPrompt = (
  skillName: string,
  skill: SkillData,
): string => {
  const monthsExperience = Math.floor(
    (skill.lastUsed.getTime() - skill.firstUsed.getTime()) /
      (30 * 24 * 60 * 60 * 1000),
  );

  return `Validate this developer skill assessment based on evidence.

Skill: ${skillName}
Category: ${skill.category}
Current Level: ${skill.level}
Evidence Count: ${skill.evidenceCount}
Months of Experience: ${monthsExperience}
Current Confidence: ${skill.confidence?.toFixed(2) || 'N/A'}

Recent Evidence (up to 10):
${skill.evidence
  .map(
    (e) =>
      `- ${e.evidenceType}: ${e.resourceUrl} (${e.occurredAt.toISOString().split('T')[0]})`,
  )
  .join('\n')}

Skill Level Guidelines:
- BEGINNER: Basic understanding, 1-5 evidence pieces, <6 months
- INTERMEDIATE: Regular use, 5-15 evidence pieces, 6-12 months
- ADVANCED: Deep expertise, 15-30 evidence pieces, 12-24 months
- EXPERT: Industry-level, 30+ evidence pieces, 24+ months

Evaluate:
1. Is the evidence sufficient for the claimed level?
2. Is the time span consistent with the level?
3. Is the evidence diverse (multiple repos/projects)?

Return JSON:
{
  "valid": true/false,
  "suggestedLevel": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
  "feedback": "Brief explanation of your assessment"
}`;
};

export const buildSkillInferenceSummaryPrompt = (
  skills: Array<{ name: string; level: string; evidenceCount: number }>,
): string => {
  return `Generate a professional skill summary for a developer profile.

Skills:
${skills.map((s) => `- ${s.name} (${s.level}): ${s.evidenceCount} evidence pieces`).join('\n')}

Generate a 2-3 sentence summary that:
1. Highlights top skills and expertise areas
2. Uses professional language for LinkedIn/resume
3. Avoids generic phrases

Return JSON:
{
  "summary": "Your professional skill summary",
  "topSkills": ["skill1", "skill2", "skill3"],
  "expertise": "Primary area of expertise"
}`;
};

export const buildSkillGapAnalysisPrompt = (
  currentSkills: string[],
  targetRole: string,
): string => {
  return `Analyze skill gaps for a developer targeting a specific role.

Current Skills: ${currentSkills.join(', ')}
Target Role: ${targetRole}

Identify:
1. Skills the developer has that are relevant
2. Skills typically needed for this role that are missing
3. Recommended learning priorities

Return JSON:
{
  "relevantSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "learningPath": ["priority1", "priority2", "priority3"]
}`;
};
