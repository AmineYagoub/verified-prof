import type { Skill, SkillEvidence, SkillAssessment, SkillLevel, EvidenceType, AssessmentType } from './prisma';

export interface SkillWithEvidence extends Skill {
  evidence?: SkillEvidence[];
  assessments?: SkillAssessment[];
}

export interface SkillEvidenceDetail {
  id: string;
  skillName: string;
  evidenceType: EvidenceType;
  resourceUrl: string;
  confidence: number;
  occurredAt: Date;
}

export interface SkillAssessmentDetail {
  id: string;
  skillName: string;
  assessedLevel: SkillLevel;
  assessmentType: AssessmentType;
  confidence: number;
  assessedAt: Date;
}
