import type { User, UserCurrentProfile, ProfileVisibility, Achievement, Badge, Skill } from './prisma';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername: string | null;
  profileSummary: string | null;
  profileHighlights: string | null;
  visibility: ProfileVisibility;
}

export interface PublicProfile {
  id: string;
  name: string | null;
  githubUsername: string | null;
  profileSummary: string | null;
  totalAchievements: number;
  totalBadges: number;
  totalSkills: number;
}

export interface UserCurrentProfileWithRelations extends UserCurrentProfile {
  user?: Pick<User, 'id' | 'name' | 'email' | 'githubUsername'>;
  currentSnapshot?: {
    achievements: Achievement[];
    badges: Badge[];
    skills: Skill[];
  };
}
