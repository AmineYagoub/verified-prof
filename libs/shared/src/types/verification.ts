import type { VerificationClaim, ClaimType, ClaimStatus } from './prisma';

export interface VerificationClaimDetail extends VerificationClaim {
  claimSummary: string;
}

export interface CreateClaimRequest {
  userId: string;
  claimType: ClaimType;
  claimData: Record<string, unknown>;
  evidence?: Record<string, unknown>;
}

export interface ClaimReviewRequest {
  claimId: string;
  status: ClaimStatus;
  rejectionReason?: string;
}
