export interface FileWithMetadata {
  path: string;
  editCount: number;
  lastModified: string;
}

export interface ArchitecturalLayerResult {
  layer: string;
  description: string;
  fileCount: number;
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
    "fileCount": 5
  },
  {
    "layer": "Database Layer", 
    "description": "Database schema and migrations",
    "fileCount": 12
  }
]

Rules:
- Create exactly 6 layers (even if some are empty)
- Each file must belong to exactly ONE layer
- Order layers from infrastructure (bottom of stack) to UI (top of stack)
- Description should be 5-10 words explaining what this layer does
- If a layer has no files, set fileCount to 0 but include the layer
- Return fileCount as the number of files in each layer, not the file paths
- Group semantically: "frontend/", "ui/", "components/" all go to Frontend or UI layer
- "services/", "controllers/", "api/" belong to Backend or Business Logic

Return the JSON array now:`;
};
