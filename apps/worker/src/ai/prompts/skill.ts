import { ActivitySummary } from '@verified-prof/shared';

export const SKILL_INFERENCE_PROMPT = (
  activitySummary: ActivitySummary,
) => `You are analyzing a developer's GitHub activity to infer their technical skills.

Activity Summary:
${JSON.stringify(activitySummary, null, 2)}

Your task:
1. Identify the developer's technical skills from their activity
2. Categorize each skill (LANGUAGE, FRAMEWORK, DATABASE, DEVOPS, TESTING, OTHER)
3. Assess proficiency level based on evidence count and recency
4. Return ONLY the skills that are clearly demonstrated

Skill Levels:
- BEGINNER: 1-9 occurrences
- INTERMEDIATE: 10-29 occurrences
- ADVANCED: 30-99 occurrences
- EXPERT: 100+ occurrences

Categories:
- LANGUAGE: Programming languages (TypeScript, Python, Go, etc.)
- FRAMEWORK: Web frameworks (React, Next.js, NestJS, etc.)
- DATABASE: Databases and ORMs (PostgreSQL, Prisma, etc.)
- DEVOPS: DevOps tools (Docker, Kubernetes, CI/CD, etc.)
- TESTING: Testing frameworks and tools (Jest, Cypress, etc.)
- OTHER: Other technical skills

Return JSON:
{
  "skills": [
    {
      "name": "Skill name",
      "category": "CATEGORY",
      "level": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
      "evidence": number of occurrences,
      "sources": ["brief explanation of evidence"]
    }
  ]
}

Only include skills with clear evidence. Be conservative - if uncertain, exclude it.`;

export interface InferredSkills {
  skills: Array<{
    name: string;
    category: string;
    level: string;
    evidence: number;
    sources: string[];
  }>;
}
