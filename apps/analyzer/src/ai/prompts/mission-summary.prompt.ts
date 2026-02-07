interface CommitContext {
  commitSha: string;
  commitMessage: string;
  commitMessages: string[];
  totalComplexity: number;
  filesChanged: number;
  date: Date;
  commitCount?: number;
  duration?: number;
  languages: string[];
  totalFunctions: number;
  totalClasses: number;
  topImports: string[];
  decorators: string[];
}

export const generateMissionSummaryPrompt = (commits: CommitContext[]) => {
  const commitSummaries = commits
    .map((c) => {
      const duration = c.duration
        ? `${Math.round(c.duration / (60 * 60 * 1000))}h ${Math.round((c.duration % (60 * 60 * 1000)) / (60 * 1000))}m`
        : 'N/A';
      return `
## Work Session
- Date: ${c.date.toISOString()}
- Commits: ${c.commitCount || 1}
- Duration: ${duration}
- Files Changed: ${c.filesChanged}
- Total Complexity: ${c.totalComplexity}
- Languages: ${c.languages.join(', ')}
- Functions Written: ${c.totalFunctions}
- Classes Created: ${c.totalClasses}
- Top Libraries/Frameworks: ${c.topImports.join(', ')}
${c.decorators.length > 0 ? `- Decorators Used: ${c.decorators.join(', ')}` : ''}

Commit Messages:
${c.commitMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}
`;
    })
    .join('\n---\n');

  return {
    systemPrompt: `You are a technical recruiter analyzing developer work. Your job is to extract CONCRETE, SPECIFIC technical achievements from commit data that will impress hiring managers.

CRITICAL RULES:
1. Use ACTUAL technology names from the Languages field (TypeScript, React, PostgreSQL, etc.)
2. Extract specific features/problems from commit messages - don't make up generic stories
3. Use NUMBERS and METRICS when available (files changed, functions written, complexity)
4. NEVER use buzzwords: "scalable", "robust", "resilient", "sophisticated", "comprehensive", "engineered", "architected"
5. Focus on WHAT was actually built, not how "amazing" it was
6. Be HONEST - if commits show refactoring, say refactoring, not "transformative innovation"

AVOID:
❌ "Engineered a scalable core service"
❌ "Architected robust data layer"
❌ "Implemented sophisticated algorithms"
❌ "Delivered comprehensive solutions"

PREFER:
✅ "Built user authentication with JWT and Redis session storage"
✅ "Refactored API validation layer covering 52 endpoints"
✅ "Created React dashboard with 15 charts using D3.js"
✅ "Migrated database schema affecting 20 tables"`,

    userPrompt: `
# Developer Work Analysis

Analyze these ${commits.length} work sessions. Each session represents related commits from the developer's actual work.

${commitSummaries}

## Your Task

For EACH work session, analyze the commit messages to understand what was ACTUALLY built, then generate:

1. **impact**: Based on commit messages:
   - "Feature" - new functionality (feat:, add, create, implement)
   - "Refactor" - code improvement (refactor:, cleanup, reorganize)
   - "Fix" - bug fixes (fix:, bug:, hotfix:)
   - "Infrastructure" - tooling, CI/CD, deployment

2. **title**: 8-12 words describing the actual feature/change
   - Extract from commit messages what was built
   - Use actual technology names from Languages field
   - Example: "Built REST API for user management with PostgreSQL"
   - NOT: "Developed scalable backend infrastructure"

3. **summary**: 2-3 sentences explaining:
   - What specific feature/system was built (be concrete!)
   - What technologies were used (from Languages field)
   - Why it matters (business value, performance, user impact)
   - Use commit messages as your primary source of truth

4. **achievements**: 2-4 bullet points with SPECIFIC details:
   - Include numbers: "Updated 52 API endpoints", "Created 28 React components"
   - Name ACTUAL libraries/frameworks: "Integrated Stripe payment API", "Set up Redis caching", "Used Prisma for database migrations"
   - Extract library names from topImports field: React, Express, Prisma, Zod, etc.
   - Show impact: "Reduced API latency from 500ms to 80ms"
   - Extract from: filesChanged count, totalFunctions count, totalClasses count, commit messages, topImports

5. **patterns**: 2-4 SPECIFIC technical patterns using actual library/framework names:
   - Use EXACT names from topImports and Languages fields
   - React patterns: "React Hooks", "React Context", "React Server Components"
   - Backend patterns: "NestJS Modules", "Express Middleware", "Prisma ORM", "TypeORM"
   - Testing: "Jest Unit Tests", "Playwright E2E"
   - Auth: "JWT Authentication", "OAuth2", "Passport.js"
   - State: "Redux", "Zustand", "TanStack Query"
   - DO NOT use generic terms like "Type-Safe", "REST", "OOP" unless nothing else fits
   - Examples: "Prisma ORM", "NestJS Dependency Injection", "React Hooks", "Zod Validation"

6. **architecturalFeat**: Be MORE AGGRESSIVE - include if ANY of these are true:
   - Complexity > 300 (was 500)
   - 3+ languages (was 5+)
   - 50+ files (was 100+)
   - Multiple services/modules being integrated
   - New system-level patterns introduced (caching, queuing, event-driven, etc.)
   - Describe the actual system design using specific technologies
   - Examples: "NestJS microservices communicating via RabbitMQ", "React SPA with TanStack Query for server state"
   - Otherwise: null

7. **domainContext**: 
   - Frontend: React, Vue, Angular, Svelte, UI components
   - Backend: API, database, server logic, authentication
   - DevOps: Docker, CI/CD, deployment, monitoring
   - Testing: test files, QA, e2e

## Critical Instructions

- SKIP LOW-VALUE MISSIONS: If a session is primarily dependency updates, config changes, or build script tweaks with no meaningful code changes, DO NOT include it in the response. Examples of what to skip:
  * "Updated project dependencies"
  * "Bump package versions"
  * "Update build configurations"
  * "Update .gitignore"
  * "Format code" (unless part of larger refactor)
- Only include missions that demonstrate actual development work: features, refactors, fixes, or meaningful infrastructure
- READ THE COMMIT MESSAGES CAREFULLY - they contain the actual work done
- Use EXACT library/framework names from topImports field (React, Prisma, NestJS, Zod, Express, etc.)
- Use EXACT language names from Languages field
- Convert metrics to achievements: ${commits[0]?.filesChanged} files → "Modified ${commits[0]?.filesChanged} files across codebase"
- If commit says "add user auth" → title should be about user authentication
- If commit says "refactor API" → don't call it a "feature", call it "Refactor"
- NO GENERIC CORPORATE SPEAK - write like a developer explaining their work to another developer
- For patterns, prefer "Prisma ORM" over "Database", "NestJS Modules" over "Backend", "React Hooks" over "Frontend"

## Examples of Good Responses

Example 1 (Feature):
{
  "title": "Built user authentication with JWT, Redis sessions, and Passport.js",
  "summary": "Implemented secure authentication flow using JSON Web Tokens with Redis-based session management. Added login, registration, and password reset endpoints with email verification using Passport.js strategies.",
  "achievements": [
    "Created 8 API endpoints for auth flows using NestJS and TypeScript",
    "Integrated Redis for session storage supporting 10K concurrent users",
    "Implemented JWT token refresh with Passport.js strategies"
  ],
  "patterns": ["NestJS Modules", "Passport.js", "JWT Authentication", "Redis Caching"],
  "architecturalFeat": "Modular NestJS authentication system with Redis session store and JWT strategy"
}

Example 2 (Refactor):
{
  "title": "Refactored API validation with Zod schemas across 52 endpoints",
  "summary": "Standardized input validation across all API endpoints using Zod schemas. Replaced scattered validation logic with centralized middleware, reducing code duplication by 40%.",
  "achievements": [
    "Created 52 Zod validation schemas for TypeScript API routes",
    "Reduced validation code from 1,200 to 720 lines",
    "Integrated class-validator decorators for NestJS DTOs"
  ],
  "patterns": ["Zod Validation", "NestJS DTOs", "class-validator"],
  "architecturalFeat": "Centralized validation layer using Zod schemas with NestJS pipes"
}

Generate mission summaries now following these exact guidelines.
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
          'patterns',
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
          patterns: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 4,
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
