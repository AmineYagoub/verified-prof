/**
 * Badge Criteria Definitions
 * Defines requirements for earning each badge type
 */

import { BadgeType } from '@verified-prof/prisma';

export interface BadgeCriteria {
  type: BadgeType;
  name: string;
  description: string;
  requirements: BadgeRequirement[];
  minimumConfidence: number;
}

export interface BadgeRequirement {
  metric: BadgeMetric;
  threshold: number;
  timeWindowDays?: number;
  description: string;
}

export type BadgeMetric =
  | 'total_commits'
  | 'commits_in_window'
  | 'pr_reviews'
  | 'merged_prs'
  | 'security_achievements'
  | 'performance_achievements'
  | 'testing_achievements'
  | 'documentation_achievements'
  | 'avg_quality_score'
  | 'consecutive_days'
  | 'oss_contributions'
  | 'auth_achievements';

export const BADGE_CRITERIA: Record<BadgeType, BadgeCriteria> = {
  [BadgeType.PROLIFIC_SHIPPER]: {
    type: BadgeType.PROLIFIC_SHIPPER,
    name: 'Prolific Shipper',
    description: 'Consistently ships code with 50+ quality commits in 90 days',
    minimumConfidence: 0.85,
    requirements: [
      {
        metric: 'commits_in_window',
        threshold: 50,
        timeWindowDays: 90,
        description: '50+ commits in last 90 days',
      },
      {
        metric: 'avg_quality_score',
        threshold: 60,
        description: 'Average quality score above 60',
      },
    ],
  },

  [BadgeType.CENTURY_CLUB]: {
    type: BadgeType.CENTURY_CLUB,
    name: 'Century Club',
    description: 'Elite contributor with 100+ quality commits in 90 days',
    minimumConfidence: 0.9,
    requirements: [
      {
        metric: 'commits_in_window',
        threshold: 100,
        timeWindowDays: 90,
        description: '100+ commits in last 90 days',
      },
      {
        metric: 'avg_quality_score',
        threshold: 65,
        description: 'Average quality score above 65',
      },
    ],
  },

  [BadgeType.CODE_REVIEWER]: {
    type: BadgeType.CODE_REVIEWER,
    name: 'Code Reviewer',
    description: 'Active participant in code reviews with 10+ reviews',
    minimumConfidence: 0.8,
    requirements: [
      {
        metric: 'pr_reviews',
        threshold: 10,
        description: '10+ pull request reviews',
      },
    ],
  },

  [BadgeType.REVIEW_CHAMPION]: {
    type: BadgeType.REVIEW_CHAMPION,
    name: 'Review Champion',
    description: 'Expert code reviewer with 50+ thorough reviews',
    minimumConfidence: 0.85,
    requirements: [
      {
        metric: 'pr_reviews',
        threshold: 50,
        description: '50+ pull request reviews',
      },
    ],
  },

  [BadgeType.AUTH_EXPERT]: {
    type: BadgeType.AUTH_EXPERT,
    name: 'Auth Expert',
    description: 'Specialist in authentication and authorization systems',
    minimumConfidence: 0.8,
    requirements: [
      {
        metric: 'auth_achievements',
        threshold: 3,
        description: '3+ authentication-related achievements',
      },
      {
        metric: 'security_achievements',
        threshold: 2,
        description: '2+ security achievements',
      },
    ],
  },

  [BadgeType.SECURITY_FOCUSED]: {
    type: BadgeType.SECURITY_FOCUSED,
    name: 'Security Focused',
    description:
      'Demonstrates strong security awareness with 5+ security contributions',
    minimumConfidence: 0.85,
    requirements: [
      {
        metric: 'security_achievements',
        threshold: 5,
        description: '5+ security-related achievements',
      },
    ],
  },

  [BadgeType.PERFORMANCE_OPTIMIZER]: {
    type: BadgeType.PERFORMANCE_OPTIMIZER,
    name: 'Performance Optimizer',
    description: 'Expert at improving system performance with 5+ optimizations',
    minimumConfidence: 0.85,
    requirements: [
      {
        metric: 'performance_achievements',
        threshold: 5,
        description: '5+ performance-related achievements',
      },
    ],
  },

  [BadgeType.CONSISTENT_CONTRIBUTOR]: {
    type: BadgeType.CONSISTENT_CONTRIBUTOR,
    name: 'Consistent Contributor',
    description:
      'Maintains steady contribution rhythm with 30+ consecutive days',
    minimumConfidence: 0.8,
    requirements: [
      {
        metric: 'consecutive_days',
        threshold: 30,
        description: '30+ consecutive days with commits',
      },
    ],
  },

  [BadgeType.STREAK_MASTER]: {
    type: BadgeType.STREAK_MASTER,
    name: 'Streak Master',
    description:
      'Exceptional dedication with 90+ consecutive days of contributions',
    minimumConfidence: 0.9,
    requirements: [
      {
        metric: 'consecutive_days',
        threshold: 90,
        description: '90+ consecutive days with commits',
      },
    ],
  },

  [BadgeType.OPEN_SOURCE_CONTRIBUTOR]: {
    type: BadgeType.OPEN_SOURCE_CONTRIBUTOR,
    name: 'Open Source Contributor',
    description: 'Active member of the open source community',
    minimumConfidence: 0.8,
    requirements: [
      {
        metric: 'oss_contributions',
        threshold: 5,
        description: '5+ contributions to public repositories',
      },
    ],
  },

  [BadgeType.DOCUMENTATION_HERO]: {
    type: BadgeType.DOCUMENTATION_HERO,
    name: 'Documentation Hero',
    description:
      'Champion of documentation with 5+ documentation contributions',
    minimumConfidence: 0.8,
    requirements: [
      {
        metric: 'documentation_achievements',
        threshold: 5,
        description: '5+ documentation-related achievements',
      },
    ],
  },

  [BadgeType.TESTING_CHAMPION]: {
    type: BadgeType.TESTING_CHAMPION,
    name: 'Testing Champion',
    description: 'Quality advocate with strong testing practices',
    minimumConfidence: 0.85,
    requirements: [
      {
        metric: 'testing_achievements',
        threshold: 5,
        description: '5+ testing-related achievements',
      },
    ],
  },
};

export const getBadgeCriteria = (type: BadgeType): BadgeCriteria => {
  return BADGE_CRITERIA[type];
};

export const getAllBadgeTypes = (): BadgeType[] => {
  return Object.values(BadgeType);
};
