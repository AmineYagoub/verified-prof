import type { QualityMetricsResult } from '../../quality/services/commit-scorer.service';

/**
 * Builds prompt for generating human-readable quality explanations.
 * Takes quality metrics and produces narrative feedback.
 */
export const buildQualityExplanationPrompt = (commit: {
  sha: string;
  message: string;
  metrics: QualityMetricsResult;
}): string => {
  const { metrics } = commit;

  return `Generate a concise, actionable explanation for this commit's quality score.

COMMIT:
Message: ${commit.message.split('\n')[0]}
SHA: ${commit.sha.substring(0, 8)}

METRICS:
Overall Score: ${metrics.overallScore}/100
Discipline: ${metrics.disciplineScore}/100 ${metrics.isDisciplined ? '✓' : '✗'}
Clarity: ${metrics.clarityScore}/100 ${metrics.isClear ? '✓' : '✗'}
Impact: ${metrics.impactScore}/100
Consistency: ${metrics.consistencyScore}/100

Details:
- Files changed: ${metrics.filesChanged}
- Lines added: ${metrics.linesAdded}
- Lines deleted: ${metrics.linesDeleted}
- Scope score: ${metrics.scopeScore}/100
- Message score: ${metrics.messageScore}/100
- Testing score: ${metrics.testingScore}/100

${metrics.hasAntiPatterns ? `⚠️ ANTI-PATTERNS DETECTED (Suspicion: ${metrics.suspicionScore}/100)\nFlags: ${metrics.flagReasons.join(', ')}` : ''}

GUIDELINES:
1. Start with overall assessment (Great work / Good work / Needs improvement)
2. Highlight strengths (what went well)
3. Suggest 1-2 specific improvements if score < 80
4. Keep it encouraging and constructive
5. Be concise (2-3 sentences max)
6. Focus on actionable feedback

OUTPUT FORMAT (JSON):
{
  "summary": "Brief one-sentence summary",
  "strengths": ["Clear commit message", "Focused scope"],
  "improvements": ["Consider adding test coverage"],
  "tone": "positive" | "neutral" | "constructive"
}

Generate explanation:`;
};

/**
 * Builds prompt for analyzing edge cases in quality scoring.
 * Used when deterministic rules are ambiguous.
 */
export const buildEdgeCaseAnalysisPrompt = (commit: {
  message: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  changedFiles: Array<{ filename: string; status: string }>;
}): string => {
  const fileList = commit.changedFiles
    .map((f) => `${f.status}: ${f.filename}`)
    .join('\n');

  return `Analyze this commit for edge cases that might affect quality scoring.

COMMIT:
Message: ${commit.message}
Changes: +${commit.additions} -${commit.deletions}
Files: ${commit.filesChanged}

CHANGED FILES:
${fileList}

EDGE CASES TO DETECT:
1. **Mass Refactor**: Large changes across many files but same pattern (should be OK)
2. **Generated Code**: Auto-generated files (lockfiles, migrations, builds) - don't penalize
3. **Documentation Heavy**: Mostly docs/comments - lower test requirements
4. **Config Changes**: Infrastructure/config only - different expectations
5. **Legitimate Large Work**: Complex features requiring many changes
6. **Test Files Only**: Pure test additions - should score high

OUTPUT FORMAT (JSON):
{
  "edgeCaseDetected": true/false,
  "edgeCaseType": "mass_refactor" | "generated_code" | "documentation" | "config" | "complex_feature" | "test_only" | null,
  "reasoning": "Why this is an edge case",
  "scoringAdjustment": {
    "disciplineModifier": 0.0 to 1.0 (multiplier),
    "testingModifier": 0.0 to 1.0,
    "explanation": "How scoring should be adjusted"
  }
}

Analyze:`;
};

/**
 * Builds prompt for detecting commit message quality issues.
 */
export const buildMessageQualityPrompt = (message: string): string => {
  return `Analyze this commit message for quality and clarity.

MESSAGE:
${message}

CRITERIA:
1. Uses conventional commit format (feat:, fix:, docs:, etc.)
2. Clear and descriptive title
3. Explains WHAT and WHY (if body exists)
4. Proper grammar and spelling
5. Appropriate length (not too short/long)
6. Contains ticket/issue references if applicable

OUTPUT FORMAT (JSON):
{
  "score": 0-100,
  "isConventional": true/false,
  "type": "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "chore" | null,
  "hasScope": true/false,
  "clarity": "excellent" | "good" | "fair" | "poor",
  "suggestions": ["Specific improvement suggestions"],
  "strengths": ["What's good about the message"]
}

Analyze:`;
};

/**
 * Builds a simplified quality explanation prompt for event-driven processing.
 * Used by AI orchestration service when handling quality explanation events.
 */
export const buildSimplifiedQualityPrompt = (
  commitSha: string,
  metrics: {
    complexityScore: number;
    maintainabilityScore: number;
    testCoverageScore: number;
    documentationScore: number;
  },
): string => {
  return `Generate a concise quality explanation for this commit.

Commit SHA: ${commitSha}
Metrics:
- Complexity Score: ${metrics.complexityScore}/100
- Maintainability Score: ${metrics.maintainabilityScore}/100
- Test Coverage Score: ${metrics.testCoverageScore}/100
- Documentation Score: ${metrics.documentationScore}/100

Provide a brief summary and 2-3 actionable improvements.

Return JSON:
{
  "summary": "...",
  "strengths": [...],
  "improvements": [...],
  "tone": "positive" | "neutral" | "constructive"
}`;
};
