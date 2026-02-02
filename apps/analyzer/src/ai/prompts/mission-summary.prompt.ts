interface CommitContext {
  commitSha: string;
  commitMessage: string;
  files: Array<{
    path: string;
    complexity: number;
    functions: number;
    classes: number;
    language: string;
  }>;
  totalComplexity: number;
  filesChanged: number;
  date: Date;
  commitCount?: number;
  duration?: number;
}

export const generateMissionSummaryPrompt = (commits: CommitContext[]) => {
  const commitSummaries = commits
    .map((c) => {
      const duration = c.duration
        ? `${Math.round(c.duration / (60 * 60 * 1000))}h ${Math.round((c.duration % (60 * 60 * 1000)) / (60 * 1000))}m`
        : 'N/A';
      return `
## Work Session: ${c.commitMessage}
- Date: ${c.date.toISOString()}
- Commits: ${c.commitCount || 1}
- Duration: ${duration}
- Files: ${c.filesChanged}
- Total Complexity: ${c.totalComplexity}
- Languages: ${[...new Set(c.files.map((f) => f.language))].join(', ')}
- Functions: ${c.files.reduce((sum, f) => sum + f.functions, 0)}
- Classes: ${c.files.reduce((sum, f) => sum + f.classes, 0)}

File Changes:
${c.files.map((f) => `  - ${f.path} (${f.language}, complexity: ${f.complexity})`).join('\n')}
`;
    })
    .join('\n---\n');

  return {
    systemPrompt: `You are an expert engineering storyteller. Analyze commit data and generate compelling mission narratives that showcase developer achievements for recruiters and hiring managers.

Your goal is to transform technical commits into engaging stories that highlight:
- Real-world impact and business value
- Technical depth and architectural decisions
- Problem-solving and innovation
- Code quality and engineering practices`,

    userPrompt: `
# Mission Analysis Task

Analyze the following ${commits.length} work sessions and generate mission summaries that will impress recruiters.
Each session represents 4+ commits made within an 8-hour workday, showing sustained development effort.

${commitSummaries}

## Instructions

For each work session, generate:
1. **impact**: Classify as "Infrastructure", "Feature", "Refactor", or "Fix"
2. **title**: A compelling one-line summary (60 chars max)
3. **summary**: A detailed 2-3 sentence narrative explaining what was built and why it matters
4. **achievements**: Array of 2-4 specific accomplishments (e.g., "Built RESTful API with 12 endpoints", "Implemented caching layer reducing latency by 40%")
5. **architecturalFeat**: If complexity > 100 OR cross-language work OR significant architectural decision, describe it (null otherwise)
6. **domainContext**: Categorize as "Backend", "Frontend", "DevOps", "Testing", or "General"

## Output Format

Return valid JSON array matching this schema:

\`\`\`json
[
  {
    "commitSha": "abc123...",
    "impact": "Feature" | "Fix" | "Refactor" | "Infrastructure",
    "title": "Implemented JWT authentication system",
    "summary": "Built comprehensive authentication layer using JSON Web Tokens with refresh token rotation and role-based access control. Integrated Passport.js middleware across all API routes with Redis session storage for horizontal scalability.",
    "achievements": [
      "Designed secure token refresh mechanism with automatic rotation",
      "Implemented role-based authorization for 15+ API endpoints",
      "Added Redis caching reducing auth latency by 60%"
    ],
    "architecturalFeat": "Architected stateless authentication system supporting 10K concurrent users with sub-100ms token validation",
    "domainContext": "Backend"
  }
]
\`\`\`

## Quality Guidelines

- **Be specific**: Use numbers, technologies, and concrete outcomes
- **Show impact**: Explain business value, not just technical details
- **Be honest**: Don't exaggerate, but highlight real achievements
- **Use active voice**: "Built", "Implemented", "Architected", not "Added code for"
- **Focus on results**: What problem did this solve? What does it enable?

Generate the mission summaries now.
`,

    jsonSchema: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'commitSha',
          'impact',
          'title',
          'summary',
          'achievements',
          'architecturalFeat',
          'domainContext',
        ],
        properties: {
          commitSha: { type: 'string' },
          impact: {
            type: 'string',
            enum: ['Infrastructure', 'Feature', 'Refactor', 'Fix'],
          },
          title: { type: 'string', maxLength: 80 },
          summary: { type: 'string', minLength: 50, maxLength: 500 },
          achievements: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 5,
          },
          architecturalFeat: { type: ['string', 'null'] },
          domainContext: {
            type: 'string',
            enum: ['Backend', 'Frontend', 'DevOps', 'Testing', 'General'],
          },
        },
      },
    },
  };
};
