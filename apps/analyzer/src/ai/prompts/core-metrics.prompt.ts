import {
  TagSummary,
  CodeOwnershipDto,
  PullRequestReviewDto,
  CommitMetadataDto,
} from '@verified-prof/shared';

const aggregateLanguages = (tags: TagSummary[]): string => {
  const langCount = new Map<string, number>();
  tags.forEach((t) => {
    const lang = t.metadata?.language || 'unknown';
    langCount.set(lang, (langCount.get(lang) || 0) + 1);
  });
  const total = tags.length;
  return Array.from(langCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => `${lang} (${Math.round((count / total) * 100)}%)`)
    .join(', ');
};

const aggregateImports = (tags: TagSummary[]): string => {
  const importCount = new Map<string, number>();
  tags.forEach((t) => {
    t.imports?.forEach((imp) => {
      const pkg = imp.split('/')[0].replace(/['"@]/g, '');
      if (pkg && pkg.length > 1) {
        importCount.set(pkg, (importCount.get(pkg) || 0) + 1);
      }
    });
  });
  return Array.from(importCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([pkg, count]) => `${pkg} (${count}x)`)
    .join(', ');
};

const extractCommitKeywords = (messages: string[]): string => {
  const keywords = new Map<string, number>();
  const patterns = {
    DevOps:
      /ci\/cd|docker|kubernetes|k8s|deploy|infrastructure|terraform|ansible|jenkins|github actions|pipeline/i,
    Backend:
      /api|database|server|endpoint|query|migration|sql|orm|cache|redis|postgres|mongo/i,
    Frontend:
      /ui|component|design|layout|css|styling|responsive|button|form|modal|react|vue|angular/i,
    ML: /model|training|dataset|prediction|ml|ai|neural|tensor/i,
    Testing: /test|spec|e2e|unit|integration|coverage/i,
    Security: /security|auth|permission|encrypt|vulnerability|cve/i,
  };

  messages.forEach((msg) => {
    Object.entries(patterns).forEach(([domain, pattern]) => {
      if (pattern.test(msg)) {
        keywords.set(domain, (keywords.get(domain) || 0) + 1);
      }
    });
  });

  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => `${domain} (${count} commits)`)
    .join(', ');
};

export const generateCoreMetricsPrompt = (context: {
  weeklyTags: TagSummary[];
  commitMessages: string[];
  weekRange: string;
  teamSize?: number;
  codeOwnership?: CodeOwnershipDto[];
  pullRequestReviews?: PullRequestReviewDto[];
  commitMetadata?: CommitMetadataDto[];
}) => {
  const languageDistribution = aggregateLanguages(context.weeklyTags);
  const topImports = aggregateImports(context.weeklyTags);
  const commitDomains = extractCommitKeywords(context.commitMessages);

  return {
    systemPrompt: `You are an elite engineering analysis AI. Analyze tree-sitter AST results, collaboration metrics, and commit data to generate accurate developer metrics. You MUST return valid JSON matching the exact schema provided.`,

    userPrompt: `
# Engineering Analysis for Week ${context.weekRange}

## Language & Technology Stack
**Language Distribution**: ${languageDistribution}
**Top Imported Libraries**: ${topImports || 'No imports detected'}
**Commit Domain Signals**: ${commitDomains || 'No domain signals detected'}

## Tree-Sitter AST Analysis Results
${JSON.stringify(context.weeklyTags.slice(0, 30), null, 2)}

${context.weeklyTags.length > 30 ? `... and ${context.weeklyTags.length - 30} more files` : ''}

## Sample Commit Messages
${context.commitMessages.slice(0, 10).join('\n')}

## Collaboration Context
${context.teamSize ? `Team Size: ${context.teamSize} contributors` : 'Solo developer'}
${context.pullRequestReviews && context.pullRequestReviews.length > 0 ? `PR Reviews: ${context.pullRequestReviews.length} reviews conducted` : 'No PR reviews tracked this week'}
${context.codeOwnership && context.codeOwnership.length > 0 ? `Code Ownership: Primary owner on ${context.codeOwnership.filter((o) => o.ownershipPercentage > 50).length} files` : ''}

## Commit Metadata (Anonymized)
${context.commitMetadata ? `Total Additions: ${context.commitMetadata.reduce((sum, c) => sum + c.additions, 0)} lines` : ''}
${context.commitMetadata ? `Total Deletions: ${context.commitMetadata.reduce((sum, c) => sum + c.deletions, 0)} lines` : ''}
${context.commitMetadata ? `Files Changed: ${context.commitMetadata.reduce((sum, c) => sum + c.filesChanged, 0)} files` : ''}
${context.commitMetadata ? `Unique Authors: ${new Set(context.commitMetadata.map((c) => c.authorId)).size}` : ''}

## Task
Analyze the tree-sitter AST results and collaboration data above to return JSON matching this EXACT schema.

## Calculation Rules:
1. **codeImpact**: Sum all (functions.length + classes.length) across files, weight by ownership percentage
2. **cycleTime**: Calculate hours between earliest and latest commit author date
3. **logicDensity**: Average complexity / functions.length (0-1 scale)
4. **systemComplexityScore**: (totalComplexity / totalFiles) * 10, max 100
5. **velocityPercentile**: Rank based on files modified, complexity, and team size context (0-100)
6. **seniorityRank**: 
   - Junior: avgComplexity < 5, < 10 functions total
   - Mid: avgComplexity 5-10, 10-30 functions, minimal PR reviews
   - Senior: avgComplexity 10-20, 30-100 functions, 1-5 PR reviews
   - Staff: avgComplexity 20-30, 100-300 functions, 5-15 PR reviews, high ownership
   - Principal: avgComplexity > 30, > 300 functions, 15+ PR reviews, system-level ownership
7. **specialization**: Combine seniorityRank with dominant technology/domain. Use the aggregated data above:
   - **Language Distribution** shows primary language (e.g., "TypeScript 70%")
   - **Top Imported Libraries** reveals tech stack (react/vue = Frontend, express/fastapi = Backend, docker/kubernetes = DevOps, tensorflow/pytorch = ML)
   - **Commit Domain Signals** confirms specialization (DevOps, Backend, Frontend, ML, Testing, Security)
   - Format: "{SeniorityRank} {Specialization}" (e.g., "Senior TypeScript", "Staff Backend Engineer", "Principal DevOps", "Mid Full-Stack")
8. **bio**: Generate a concise professional bio (maximum 20 words) highlighting the developer's specialization and seniority. Make it factual and direct without encouraging any specific action.
9. **sTierVerificationHash**: Generate a SHA-256 hash (64 chars hex)
10. **trend**: Set to null for first analysis

Return ONLY valid JSON matching the schema below.
`,

    jsonSchema: {
      type: 'object',
      required: [
        'codeImpact',
        'cycleTime',
        'logicDensity',
        'systemComplexityScore',
        'velocityPercentile',
        'seniorityRank',
        'specialization',
        'bio',
        'sTierVerificationHash',
      ],
      properties: {
        codeImpact: { type: 'integer', minimum: 0 },
        cycleTime: { type: 'number', minimum: 0 },
        logicDensity: { type: 'number', minimum: 0, maximum: 1 },
        systemComplexityScore: { type: 'number', minimum: 0, maximum: 100 },
        velocityPercentile: { type: 'number', minimum: 0, maximum: 100 },
        seniorityRank: {
          type: 'string',
          enum: ['Junior', 'Mid', 'Senior', 'Staff', 'Principal'],
        },
        specialization: {
          type: 'string',
          minLength: 3,
          maxLength: 50,
          description:
            'Technology-specific seniority (e.g., "Senior TypeScript", "Staff Backend", "Principal DevOps")',
        },
        bio: {
          type: 'string',
          maxLength: 150,
          description:
            'Professional bio (max 20 words) highlighting specialization and seniority',
        },
        sTierVerificationHash: { type: 'string', minLength: 64, maxLength: 64 },
        trend: {
          type: ['string', 'null'],
          enum: ['IMPROVING', 'STABLE', 'DECLINING', null],
        },
      },
    },
  };
};
