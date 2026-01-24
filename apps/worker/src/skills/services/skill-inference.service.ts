import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  PrismaService,
  SkillCategory,
  SkillLevel,
} from '@verified-prof/prisma';
import { AI_EVENTS } from '@verified-prof/shared';
import {
  SkillValidationRequestedEvent,
  SkillValidationCompletedEvent,
} from '../../ai/events/ai.events';
import {
  determineSkillLevel,
  findSkillByKeyword,
} from '../definitions/skill-definitions';

export interface InferredSkill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  evidenceCount: number;
  confidence: number;
  firstUsed: Date;
  lastUsed: Date;
  sources: string[];
}

export interface SkillInferenceResult {
  userId: string;
  inferredSkills: InferredSkill[];
  newSkillsAdded: number;
  skillsUpdated: number;
  totalSkills: number;
}

interface SkillEvidence {
  skillName: string;
  category: SkillCategory;
  occurredAt: Date;
  source: string;
}

@Injectable()
export class SkillInferenceService {
  private readonly logger = new Logger(SkillInferenceService.name);
  private pendingValidations = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async inferUserSkills(userId: string): Promise<SkillInferenceResult> {
    this.logger.log(`Inferring skills for user ${userId}`);

    const evidenceList = await this.gatherSkillEvidence(userId);
    const skillMap = this.aggregateSkillEvidence(evidenceList);
    const inferredSkills = this.calculateSkillLevels(skillMap);

    const { newSkillsAdded, skillsUpdated } = await this.persistSkills(
      userId,
      inferredSkills,
    );

    const totalSkills = await this.prisma.client.skill.count({
      where: { userId },
    });

    return {
      userId,
      inferredSkills,
      newSkillsAdded,
      skillsUpdated,
      totalSkills,
    };
  }

  private async gatherSkillEvidence(userId: string): Promise<SkillEvidence[]> {
    const evidence: SkillEvidence[] = [];

    const commitSignals = await this.prisma.client.commitSignal.findMany({
      where: { snapshot: { userId } },
      select: {
        languages: true,
        occurredAt: true,
        repo: true,
      },
    });

    for (const commit of commitSignals) {
      for (const lang of commit.languages) {
        const skillDef = findSkillByKeyword(lang);
        if (skillDef) {
          evidence.push({
            skillName: skillDef.name,
            category: skillDef.category as SkillCategory,
            occurredAt: commit.occurredAt,
            source: `commit:${commit.repo}`,
          });
        }
      }
    }

    const achievements = await this.prisma.client.achievement.findMany({
      where: { userId },
      select: {
        skills: true,
        achievedAt: true,
        proofUrl: true,
      },
    });

    for (const achievement of achievements) {
      const skillNames = achievement.skills.split(',').map((s) => s.trim());
      for (const skillName of skillNames) {
        const skillDef = findSkillByKeyword(skillName);
        if (skillDef) {
          evidence.push({
            skillName: skillDef.name,
            category: skillDef.category as SkillCategory,
            occurredAt: achievement.achievedAt,
            source: `achievement:${achievement.proofUrl}`,
          });
        } else if (skillName.length > 1) {
          evidence.push({
            skillName: this.normalizeSkillName(skillName),
            category: 'OTHER' as SkillCategory,
            occurredAt: achievement.achievedAt,
            source: `achievement:${achievement.proofUrl}`,
          });
        }
      }
    }

    return evidence;
  }

  private aggregateSkillEvidence(
    evidenceList: SkillEvidence[],
  ): Map<
    string,
    { skill: SkillEvidence; count: number; dates: Date[]; sources: Set<string> }
  > {
    const skillMap = new Map<
      string,
      {
        skill: SkillEvidence;
        count: number;
        dates: Date[];
        sources: Set<string>;
      }
    >();

    for (const evidence of evidenceList) {
      const key = evidence.skillName.toLowerCase();
      const existing = skillMap.get(key);

      if (existing) {
        existing.count++;
        existing.dates.push(evidence.occurredAt);
        existing.sources.add(evidence.source);
      } else {
        skillMap.set(key, {
          skill: evidence,
          count: 1,
          dates: [evidence.occurredAt],
          sources: new Set([evidence.source]),
        });
      }
    }

    return skillMap;
  }

  private calculateSkillLevels(
    skillMap: Map<
      string,
      {
        skill: SkillEvidence;
        count: number;
        dates: Date[];
        sources: Set<string>;
      }
    >,
  ): InferredSkill[] {
    const skills: InferredSkill[] = [];

    for (const [, data] of skillMap) {
      const { skill, count, dates, sources } = data;

      dates.sort((a, b) => a.getTime() - b.getTime());
      const firstUsed = dates[0];
      const lastUsed = dates[dates.length - 1];

      const monthsOfExperience = Math.floor(
        (lastUsed.getTime() - firstUsed.getTime()) / (30 * 24 * 60 * 60 * 1000),
      );

      const level = determineSkillLevel(count, monthsOfExperience);
      const confidence = this.calculateConfidence(
        count,
        monthsOfExperience,
        sources.size,
      );

      skills.push({
        name: skill.skillName,
        category: skill.category,
        level,
        evidenceCount: count,
        confidence,
        firstUsed,
        lastUsed,
        sources: Array.from(sources),
      });
    }

    return skills.sort((a, b) => b.evidenceCount - a.evidenceCount);
  }

  private calculateConfidence(
    evidenceCount: number,
    monthsOfExperience: number,
    sourceCount: number,
  ): number {
    const evidenceScore = Math.min(1, evidenceCount / 30) * 0.4;
    const timeScore = Math.min(1, monthsOfExperience / 24) * 0.3;
    const diversityScore = Math.min(1, sourceCount / 10) * 0.3;

    return Math.min(0.95, evidenceScore + timeScore + diversityScore);
  }

  private async persistSkills(
    userId: string,
    inferredSkills: InferredSkill[],
  ): Promise<{ newSkillsAdded: number; skillsUpdated: number }> {
    let newSkillsAdded = 0;
    let skillsUpdated = 0;

    for (const skill of inferredSkills) {
      try {
        const existing = await this.prisma.client.skill.findUnique({
          where: {
            userId_name: {
              userId,
              name: skill.name,
            },
          },
        });

        if (existing) {
          const shouldUpdate =
            skill.evidenceCount > existing.evidenceCount ||
            skill.lastUsed > existing.lastUsed;

          if (shouldUpdate) {
            await this.prisma.client.skill.update({
              where: { id: existing.id },
              data: {
                level: skill.level,
                evidenceCount: skill.evidenceCount,
                lastUsed: skill.lastUsed,
                confidence: skill.confidence,
                evidenceSummary: { sources: skill.sources },
              },
            });
            skillsUpdated++;
          }
        } else {
          await this.prisma.client.skill.create({
            data: {
              userId,
              name: skill.name,
              category: skill.category,
              level: skill.level,
              evidenceCount: skill.evidenceCount,
              firstUsed: skill.firstUsed,
              lastUsed: skill.lastUsed,
              confidence: skill.confidence,
              verificationStatus: 'PENDING',
              evidenceSummary: { sources: skill.sources },
            },
          });
          newSkillsAdded++;
        }
      } catch (error) {
        this.logger.error(`Failed to persist skill ${skill.name}`, error);
      }
    }

    return { newSkillsAdded, skillsUpdated };
  }

  private normalizeSkillName(name: string): string {
    return name
      .trim()
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async validateSkillWithAI(
    userId: string,
    skillName: string,
  ): Promise<{ valid: boolean; suggestedLevel: SkillLevel; feedback: string }> {
    try {
      const skill = await this.prisma.client.skill.findUnique({
        where: { userId_name: { userId, name: skillName } },
        include: { evidence: { take: 10 } },
      });

      if (!skill) {
        return {
          valid: false,
          suggestedLevel: 'BEGINNER',
          feedback: 'Skill not found',
        };
      }

      const requestId = `skill_${userId}_${skillName}_${Date.now()}`;

      return new Promise((resolve, reject) => {
        // Store resolver
        this.pendingValidations.set(requestId, { resolve, reject });

        // Set timeout (30 seconds)
        setTimeout(() => {
          if (this.pendingValidations.has(requestId)) {
            this.pendingValidations.delete(requestId);
            reject(new Error('AI validation timeout'));
          }
        }, 30000);

        // Emit validation request
        this.eventEmitter.emit(
          AI_EVENTS.SKILL_VALIDATION_REQUESTED,
          new SkillValidationRequestedEvent(
            requestId,
            userId,
            skillName,
            skill.level,
            skill.evidence.map((e) => ({
              type: e.evidenceType,
              description: e.resourceUrl,
              date: e.occurredAt.toISOString(),
            })),
          ),
        );
      });
    } catch (error) {
      return {
        valid: true,
        suggestedLevel: 'BEGINNER',
        feedback: 'Validation failed, using default',
      };
    }
  }

  /**
   * Handle AI skill validation completion
   */
  @OnEvent(AI_EVENTS.SKILL_VALIDATION_COMPLETED)
  async handleSkillValidated(
    event: SkillValidationCompletedEvent,
  ): Promise<void> {
    const pending = this.pendingValidations.get(event.requestId);
    if (!pending) return;

    pending.resolve({
      valid: event.isValid,
      suggestedLevel: event.suggestedLevel as SkillLevel,
      feedback: event.reasoning,
    });

    this.pendingValidations.delete(event.requestId);
  }
}
