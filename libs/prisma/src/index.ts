export { PrismaClient } from './generated/client';
export { DbModule } from './lib/db.module';
export { PrismaService } from './lib/prisma.service';

// Export Prisma enums
export {
  BadgeType,
  SkillCategory,
  SkillLevel,
  AchievementCategory,
  ImpactLevel,
  ProofType,
  VerificationStatus,
  JobStatus,
  ProviderType,
  TriggerType,
  JobPriority,
  SnapshotStatus,
  SyncStatus,
  ProfileVisibility,
} from './generated/client';
