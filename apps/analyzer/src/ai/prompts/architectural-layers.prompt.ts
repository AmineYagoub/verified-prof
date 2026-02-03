export interface FileWithMetadata {
  path: string;
  editCount: number;
  lastModified: string;
}

export interface ArchitecturalLayerResult {
  layer: string;
  description: string;
  files: string[];
}

export const createArchitecturalLayersPrompt = (
  files: FileWithMetadata[],
): string => {
  return `You are an expert software architect analyzing a codebase structure.

Group these files into architectural layers following this standard full-stack hierarchy:

1. Infrastructure Layer - Docker, CI/CD, deployment configs, monitoring
2. Database Layer - Schemas, migrations, ORM configs, database scripts
3. Backend API Layer - Controllers, routes, API endpoints, middleware
4. Business Logic Layer - Services, domain logic, business rules, algorithms
5. Frontend Layer - React/Vue components, client services, state management
6. UI/UX Layer - Styles, themes, design tokens, UI components, accessibility

Files to analyze:
${files.map((f, i) => `${i + 1}. ${f.path} (edited ${f.editCount}x, last: ${f.lastModified})`).join('\n')}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "layer": "Infrastructure Layer",
    "description": "CI/CD pipelines and deployment automation",
    "files": ["docker-compose.yml", ".github/workflows/ci.yml"]
  },
  {
    "layer": "Database Layer", 
    "description": "Database schema and migrations",
    "files": ["prisma/schema.prisma", "migrations/001_init.sql"]
  }
]

Rules:
- Create exactly 6 layers (even if some are empty)
- Each file must belong to exactly ONE layer
- Order layers from infrastructure (bottom of stack) to UI (top of stack)
- Description should be 5-10 words explaining what this layer does
- If a layer has no files, set files to empty array but include the layer
- Group semantically: "frontend/", "ui/", "components/" all go to Frontend or UI layer
- "services/", "controllers/", "api/" belong to Backend or Business Logic

Return the JSON array now:`;
};
