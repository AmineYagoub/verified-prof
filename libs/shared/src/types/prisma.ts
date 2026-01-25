// Single source of truth for all Prisma types and enums
// Both API and UI import from here

export type { InputJsonValue } from '../../../prisma/src/generated/runtime/client';

export type {
  // Models
  User,
  Account,
  Session,
  Achievement,
  Badge,
  Skill,
  AnalysisJob,
  AnalysisSnapshot,
  UserCurrentProfile,
  DataFingerprint,
  SkillEvidence,
  SkillAssessment,
  VerificationClaim,
  ProviderConnection,
  UserSettings,
  // Enums
  ImpactLevel,
  AchievementCategory,
  ProofType,
  BadgeType,
  SkillCategory,
  SkillLevel,
  JobStatus,
  SnapshotStatus,
  ProviderType,
  FingerprintResourceType,
  EvidenceType,
  AssessmentType,
  ClaimType,
  ClaimStatus,
  VerificationStatus,
  SyncStatus,
  TriggerType,
  JobPriority,
  ProfileVisibility,
} from '../../../prisma/src/generated/client';
