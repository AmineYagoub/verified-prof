export const CATEGORY_KEYWORDS = {
  AUTH: ['oauth', 'auth', 'authentication', 'authorization', 'login', 'jwt', 'session', 'signin', 'signup', 'sso', '2fa', 'mfa', 'identity', 'permission'],
  SECURITY: ['security', 'xss', 'csrf', 'vulnerability', 'exploit', 'injection', 'sanitization', 'encryption', 'hash', 'secure', 'cve', 'attack', 'protect'],
  PERFORMANCE: ['performance', 'optimization', 'cache', 'caching', 'lazy', 'debounce', 'throttle', 'memo', 'optimize', 'speed', 'fast', 'slow', 'latency', 'throughput', 'load', 'efficiency'],
  DOCUMENTATION: ['doc', 'documentation', 'readme', 'comment', 'guide', 'tutorial', 'example', 'wiki', 'md', 'markdown', 'typing', 'types'],
  TESTING: ['test', 'spec', 'mock', 'stub', 'coverage', 'jest', 'vitest', 'cypress', 'playwright', 'testing', 'unittest', 'integration', 'e2e', 'fixture']
};

export function classifyPR(title: string, body: string | null, labels: string[]): string | null {
  const text = `${title} ${body || ''} ${labels.join(' ')}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return null;
}
