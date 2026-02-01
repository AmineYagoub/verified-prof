import {
  TagSummary,
  CodeOwnershipDto,
  PullRequestReviewDto,
  CommitMetadataDto,
} from '@verified-prof/shared';

export const generateCoreMetricsPrompt = (context: {
  weeklyTags: TagSummary[];
  commitMessages: string[];
  weekRange: string;
  teamSize?: number;
  codeOwnership?: CodeOwnershipDto[];
  pullRequestReviews?: PullRequestReviewDto[];
  commitMetadata?: CommitMetadataDto[];
}) => ({
  systemPrompt: `You are an elite engineering analysis AI. Analyze tree-sitter AST results, collaboration metrics, and commit data to generate accurate developer metrics. You MUST return valid JSON matching the exact schema provided.`,

  userPrompt: `
# Engineering Analysis for Week ${context.weekRange}

## Tree-Sitter AST Analysis Results
${JSON.stringify(context.weeklyTags.slice(0, 50), null, 2)}

${context.weeklyTags.length > 50 ? `... and ${context.weeklyTags.length - 50} more files` : ''}

## Commit Messages
${context.commitMessages.slice(0, 20).join('\n')}

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
7. **sTierVerificationHash**: Generate a SHA-256 hash (64 chars hex)
8. **trend**: Set to null for first analysis

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
      sTierVerificationHash: { type: 'string', minLength: 64, maxLength: 64 },
      trend: {
        type: ['string', 'null'],
        enum: ['IMPROVING', 'STABLE', 'DECLINING', null],
      },
    },
  },
});
