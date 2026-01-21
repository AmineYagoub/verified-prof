export const BADGE_DEFINITIONS = [
  {
    type: 'PROLIFIC_SHIPPER',
    name: 'Prolific Shipper',
    description: 'Ship code like a pro - consistently delivering PRs',
    requirements: [{ metric: 'pr_count', threshold: 50 }],
  },
  {
    type: 'CENTURY_CLUB',
    name: 'Century Club',
    description: '100+ merged PRs - a coding centurion',
    requirements: [{ metric: 'pr_count', threshold: 100 }],
  },
  {
    type: 'CODE_REVIEWER',
    name: 'Code Reviewer',
    description: 'Active code reviewer helping improve code quality',
    requirements: [{ metric: 'review_count', threshold: 25 }],
  },
  {
    type: 'REVIEW_CHAMPION',
    name: 'Review Champion',
    description: 'Elite code reviewer with 100+ reviews',
    requirements: [{ metric: 'review_count', threshold: 100 }],
  },
  {
    type: 'AUTH_EXPERT',
    name: 'Auth Expert',
    description: 'Specialist in authentication and authorization systems',
    requirements: [
      { metric: 'category_pr_count', threshold: 5, category: 'AUTH' },
    ],
    aiValidation:
      'Verify that the PRs demonstrate significant auth work (OAuth, JWT, sessions, SSO, etc.)',
  },
  {
    type: 'SECURITY_FOCUSED',
    name: 'Security Focused',
    description: 'Developer focused on security improvements',
    requirements: [
      { metric: 'category_pr_count', threshold: 5, category: 'SECURITY' },
    ],
    aiValidation:
      'Verify that the PRs demonstrate meaningful security work (vulnerability fixes, security audits, XSS/CSRF prevention, etc.)',
  },
  {
    type: 'PERFORMANCE_OPTIMIZER',
    name: 'Performance Optimizer',
    description: 'Expert at optimizing application performance',
    requirements: [
      { metric: 'category_pr_count', threshold: 5, category: 'PERFORMANCE' },
    ],
    aiValidation:
      'Verify that the PRs demonstrate significant performance improvements (caching, database optimization, lazy loading, etc.)',
  },
  {
    type: 'CONSISTENT_CONTRIBUTOR',
    name: 'Consistent Contributor',
    description: 'Maintains steady contribution over 6+ months',
    requirements: [{ metric: 'streak_days', threshold: 180 }],
  },
  {
    type: 'STREAK_MASTER',
    name: 'Streak Master',
    description: 'Year-long contribution streak',
    requirements: [{ metric: 'streak_days', threshold: 365 }],
  },
  {
    type: 'OPEN_SOURCE_CONTRIBUTOR',
    name: 'Open Source Contributor',
    description: 'Active contributor to open source projects',
    requirements: [{ metric: 'pr_count', threshold: 10 }],
    aiValidation: 'Verify that the PRs are in public repositories',
  },
  {
    type: 'DOCUMENTATION_HERO',
    name: 'Documentation Hero',
    description: 'Champion of comprehensive documentation',
    requirements: [
      { metric: 'category_pr_count', threshold: 10, category: 'DOCUMENTATION' },
    ],
  },
  {
    type: 'TESTING_CHAMPION',
    name: 'Testing Champion',
    description: 'Advocate for code quality through testing',
    requirements: [
      { metric: 'category_pr_count', threshold: 10, category: 'TESTING' },
    ],
    aiValidation:
      'Verify that the PRs demonstrate meaningful testing work (unit tests, integration tests, test coverage improvements, etc.)',
  },
];
