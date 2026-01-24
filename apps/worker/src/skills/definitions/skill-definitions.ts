/**
 * Skill Definitions
 * Maps common technologies to skill categories
 */

import { SkillCategory, SkillLevel } from '@verified-prof/prisma';

export interface SkillDefinition {
  name: string;
  category: SkillCategory;
  aliases: string[];
  keywords: string[];
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // Languages
  {
    name: 'TypeScript',
    category: 'LANGUAGE',
    aliases: ['ts', 'typescript'],
    keywords: ['typescript', '.ts', '.tsx'],
  },
  {
    name: 'JavaScript',
    category: 'LANGUAGE',
    aliases: ['js', 'javascript', 'es6'],
    keywords: ['javascript', '.js', '.jsx', 'node'],
  },
  {
    name: 'Python',
    category: 'LANGUAGE',
    aliases: ['py', 'python3'],
    keywords: ['python', '.py', 'pip', 'django', 'flask'],
  },
  {
    name: 'Go',
    category: 'LANGUAGE',
    aliases: ['golang'],
    keywords: ['go', '.go', 'golang'],
  },
  {
    name: 'Rust',
    category: 'LANGUAGE',
    aliases: ['rs'],
    keywords: ['rust', '.rs', 'cargo'],
  },
  {
    name: 'Java',
    category: 'LANGUAGE',
    aliases: [],
    keywords: ['java', '.java', 'maven', 'gradle'],
  },
  {
    name: 'C#',
    category: 'LANGUAGE',
    aliases: ['csharp', 'cs'],
    keywords: ['csharp', '.cs', 'dotnet', '.net'],
  },
  {
    name: 'Ruby',
    category: 'LANGUAGE',
    aliases: ['rb'],
    keywords: ['ruby', '.rb', 'rails', 'gem'],
  },
  {
    name: 'PHP',
    category: 'LANGUAGE',
    aliases: [],
    keywords: ['php', '.php', 'laravel', 'composer'],
  },
  {
    name: 'Swift',
    category: 'LANGUAGE',
    aliases: [],
    keywords: ['swift', '.swift', 'ios', 'xcode'],
  },
  {
    name: 'Kotlin',
    category: 'LANGUAGE',
    aliases: ['kt'],
    keywords: ['kotlin', '.kt', 'android'],
  },
  {
    name: 'Scala',
    category: 'LANGUAGE',
    aliases: [],
    keywords: ['scala', '.scala', 'sbt'],
  },
  {
    name: 'SQL',
    category: 'LANGUAGE',
    aliases: [],
    keywords: ['sql', '.sql', 'query', 'database'],
  },
  {
    name: 'Shell',
    category: 'LANGUAGE',
    aliases: ['bash', 'sh', 'zsh'],
    keywords: ['bash', 'shell', '.sh', 'script'],
  },

  // Frameworks
  {
    name: 'React',
    category: 'FRAMEWORK',
    aliases: ['reactjs', 'react.js'],
    keywords: ['react', 'jsx', 'hooks', 'useState', 'useEffect'],
  },
  {
    name: 'Next.js',
    category: 'FRAMEWORK',
    aliases: ['nextjs', 'next'],
    keywords: ['next', 'nextjs', 'vercel', 'getServerSideProps'],
  },
  {
    name: 'Vue.js',
    category: 'FRAMEWORK',
    aliases: ['vue', 'vuejs'],
    keywords: ['vue', 'vuex', 'nuxt', 'composition api'],
  },
  {
    name: 'Angular',
    category: 'FRAMEWORK',
    aliases: ['ng', 'angularjs'],
    keywords: ['angular', 'ng', 'rxjs', 'ngrx'],
  },
  {
    name: 'NestJS',
    category: 'FRAMEWORK',
    aliases: ['nest'],
    keywords: ['nestjs', 'nest', '@nestjs', 'injectable'],
  },
  {
    name: 'Express',
    category: 'FRAMEWORK',
    aliases: ['expressjs'],
    keywords: ['express', 'middleware', 'router'],
  },
  {
    name: 'FastAPI',
    category: 'FRAMEWORK',
    aliases: [],
    keywords: ['fastapi', 'pydantic', 'uvicorn'],
  },
  {
    name: 'Django',
    category: 'FRAMEWORK',
    aliases: [],
    keywords: ['django', 'drf', 'django rest'],
  },
  {
    name: 'Spring',
    category: 'FRAMEWORK',
    aliases: ['spring boot', 'springboot'],
    keywords: ['spring', 'springboot', '@autowired'],
  },
  {
    name: 'Rails',
    category: 'FRAMEWORK',
    aliases: ['ruby on rails', 'ror'],
    keywords: ['rails', 'activerecord', 'rake'],
  },
  {
    name: 'Laravel',
    category: 'FRAMEWORK',
    aliases: [],
    keywords: ['laravel', 'eloquent', 'artisan'],
  },
  {
    name: 'Svelte',
    category: 'FRAMEWORK',
    aliases: ['sveltekit'],
    keywords: ['svelte', 'sveltekit', '.svelte'],
  },
  {
    name: 'Tailwind CSS',
    category: 'FRAMEWORK',
    aliases: ['tailwind', 'tailwindcss'],
    keywords: ['tailwind', 'tailwindcss', 'utility-first'],
  },

  // Databases
  {
    name: 'PostgreSQL',
    category: 'DATABASE',
    aliases: ['postgres', 'pg', 'psql'],
    keywords: ['postgresql', 'postgres', 'pg', 'psql'],
  },
  {
    name: 'MySQL',
    category: 'DATABASE',
    aliases: ['mariadb'],
    keywords: ['mysql', 'mariadb'],
  },
  {
    name: 'MongoDB',
    category: 'DATABASE',
    aliases: ['mongo'],
    keywords: ['mongodb', 'mongo', 'mongoose'],
  },
  {
    name: 'Redis',
    category: 'DATABASE',
    aliases: [],
    keywords: ['redis', 'cache', 'ioredis'],
  },
  {
    name: 'SQLite',
    category: 'DATABASE',
    aliases: [],
    keywords: ['sqlite', 'sqlite3'],
  },
  {
    name: 'DynamoDB',
    category: 'DATABASE',
    aliases: [],
    keywords: ['dynamodb', 'dynamo', 'aws'],
  },
  {
    name: 'Elasticsearch',
    category: 'DATABASE',
    aliases: ['elastic', 'es'],
    keywords: ['elasticsearch', 'elastic', 'kibana'],
  },
  {
    name: 'Prisma',
    category: 'DATABASE',
    aliases: [],
    keywords: ['prisma', '@prisma/client', 'prisma schema'],
  },

  // DevOps
  {
    name: 'Docker',
    category: 'DEVOPS',
    aliases: [],
    keywords: ['docker', 'dockerfile', 'container', 'compose'],
  },
  {
    name: 'Kubernetes',
    category: 'DEVOPS',
    aliases: ['k8s'],
    keywords: ['kubernetes', 'k8s', 'kubectl', 'helm'],
  },
  {
    name: 'AWS',
    category: 'DEVOPS',
    aliases: ['amazon web services'],
    keywords: ['aws', 'lambda', 's3', 'ec2', 'cloudfront'],
  },
  {
    name: 'GCP',
    category: 'DEVOPS',
    aliases: ['google cloud'],
    keywords: ['gcp', 'google cloud', 'cloud run', 'bigquery'],
  },
  {
    name: 'Azure',
    category: 'DEVOPS',
    aliases: [],
    keywords: ['azure', 'microsoft azure', 'az'],
  },
  {
    name: 'Terraform',
    category: 'DEVOPS',
    aliases: ['tf'],
    keywords: ['terraform', '.tf', 'hcl', 'infrastructure'],
  },
  {
    name: 'GitHub Actions',
    category: 'DEVOPS',
    aliases: ['gha'],
    keywords: ['github actions', 'workflow', '.github/workflows'],
  },
  {
    name: 'CI/CD',
    category: 'DEVOPS',
    aliases: [],
    keywords: ['ci', 'cd', 'pipeline', 'jenkins', 'circleci'],
  },
  {
    name: 'Nginx',
    category: 'DEVOPS',
    aliases: [],
    keywords: ['nginx', 'reverse proxy', 'load balancer'],
  },

  // Testing
  {
    name: 'Jest',
    category: 'TESTING',
    aliases: [],
    keywords: ['jest', 'describe', 'it', 'expect', 'mock'],
  },
  {
    name: 'Cypress',
    category: 'TESTING',
    aliases: [],
    keywords: ['cypress', 'e2e', 'end-to-end'],
  },
  {
    name: 'Playwright',
    category: 'TESTING',
    aliases: [],
    keywords: ['playwright', 'browser testing'],
  },
  { name: 'Vitest', category: 'TESTING', aliases: [], keywords: ['vitest'] },
  {
    name: 'Pytest',
    category: 'TESTING',
    aliases: [],
    keywords: ['pytest', 'python test'],
  },
  {
    name: 'JUnit',
    category: 'TESTING',
    aliases: [],
    keywords: ['junit', '@test', 'java test'],
  },
  {
    name: 'Testing Library',
    category: 'TESTING',
    aliases: ['rtl'],
    keywords: ['testing-library', 'render', 'screen', 'fireEvent'],
  },

  // Other
  {
    name: 'GraphQL',
    category: 'OTHER',
    aliases: ['gql'],
    keywords: ['graphql', 'gql', 'apollo', 'schema'],
  },
  {
    name: 'REST API',
    category: 'OTHER',
    aliases: ['restful'],
    keywords: ['rest', 'api', 'endpoint', 'http'],
  },
  {
    name: 'WebSockets',
    category: 'OTHER',
    aliases: ['ws'],
    keywords: ['websocket', 'socket.io', 'realtime'],
  },
  {
    name: 'OAuth',
    category: 'OTHER',
    aliases: ['oauth2'],
    keywords: ['oauth', 'authentication', 'jwt', 'auth'],
  },
  {
    name: 'Machine Learning',
    category: 'OTHER',
    aliases: ['ml', 'ai'],
    keywords: ['ml', 'tensorflow', 'pytorch', 'model'],
  },
];

export interface SkillLevelThresholds {
  level: SkillLevel;
  minEvidenceCount: number;
  minMonthsExperience: number;
  description: string;
}

export const SKILL_LEVEL_THRESHOLDS: SkillLevelThresholds[] = [
  {
    level: 'BEGINNER',
    minEvidenceCount: 1,
    minMonthsExperience: 0,
    description: 'Has some experience with the technology',
  },
  {
    level: 'INTERMEDIATE',
    minEvidenceCount: 5,
    minMonthsExperience: 6,
    description: 'Regularly uses this technology in projects',
  },
  {
    level: 'ADVANCED',
    minEvidenceCount: 15,
    minMonthsExperience: 12,
    description: 'Deep expertise and significant project experience',
  },
  {
    level: 'EXPERT',
    minEvidenceCount: 30,
    minMonthsExperience: 24,
    description: 'Industry-level expertise with extensive contributions',
  },
];

export const determineSkillLevel = (
  evidenceCount: number,
  monthsOfExperience: number,
): SkillLevel => {
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = SKILL_LEVEL_THRESHOLDS[i];
    if (
      evidenceCount >= threshold.minEvidenceCount &&
      monthsOfExperience >= threshold.minMonthsExperience
    ) {
      return threshold.level;
    }
  }
  return 'BEGINNER';
};

export const findSkillByKeyword = (keyword: string): SkillDefinition | null => {
  const lowerKeyword = keyword.toLowerCase();

  for (const skill of SKILL_DEFINITIONS) {
    if (skill.name.toLowerCase() === lowerKeyword) {
      return skill;
    }
    if (skill.aliases.some((a) => a.toLowerCase() === lowerKeyword)) {
      return skill;
    }
    if (skill.keywords.some((k) => lowerKeyword.includes(k.toLowerCase()))) {
      return skill;
    }
  }

  return null;
};
