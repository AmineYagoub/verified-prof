import { Injectable } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import { MasteryLevel } from '@verified-prof/shared';
import { TechnologyEvidence } from '../types/tech-detection.types';

@Injectable()
export class TechStackPersisterService {
  // Mastery level thresholds - higher bar for proficiency
  private readonly MENTIONED_THRESHOLD = 20;
  private readonly USED_THRESHOLD = 45;
  private readonly PROFICIENT_THRESHOLD = 70;

  // Score calculation constants - rebalanced for depth over diversity
  // Usage frequency: 30% of score (was 20%) - need 50+ usages for max
  private readonly USAGE_FREQUENCY_DIVISOR = 50;
  private readonly USAGE_FREQUENCY_MAX_SCORE = 30;

  // Time span: 30% of score (was 20%) - need 6 months for max
  private readonly WEEKS_ACTIVE_DIVISOR = 26;
  private readonly TIME_SPAN_MAX_SCORE = 30;

  // Consistency: 20% of score - rewards intensive work (5x/week = max)
  private readonly CONSISTENCY_MULTIPLIER = 4;
  private readonly CONSISTENCY_MAX_SCORE = 20;

  // Evidence quality: 20% of score (was 40%) - reduced to prevent gaming
  private readonly EVIDENCE_QUALITY_MULTIPLIER = 7;
  private readonly EVIDENCE_QUALITY_MAX_SCORE = 20;

  // Low usage penalties - unchanged
  private readonly MIN_USAGE_FOR_LOW_SCORE = 3;
  private readonly MIN_WEEKS_FOR_LOW_SCORE = 2;
  private readonly LOW_USAGE_MAX_SCORE = 15;

  constructor(private readonly prisma: PrismaService) {}

  async persistTechnologyStack(
    userProfileId: string,
    evidence: TechnologyEvidence[],
  ): Promise<void> {
    if (evidence.length === 0) return;

    await this.prisma.client.$transaction(async (tx) => {
      const existing = await tx.technologyStack.findMany({
        where: { userProfileId },
        select: {
          category: true,
          name: true,
        },
      });

      const existingSet = new Set(
        existing.map((e) => `${e.category}-${e.name}`),
      );
      const toCreate = evidence
        .filter((tech) => !existingSet.has(`${tech.category}-${tech.name}`))
        .map((tech) => ({
          userProfileId,
          category: tech.category,
          name: tech.name,
          version: tech.version,
          masteryLevel: this.calculateMasteryLevel(tech),
          implementationScore: this.calculateImplementationScore(tech),
          usageCount: tech.usageCount,
          totalDays: tech.totalDays,
          weeksActive: tech.weeksActive,
          firstSeen: tech.firstSeen,
          lastUsed: tech.lastUsed,
          evidenceTypes: tech.evidenceTypes,
          codePatterns: tech.codePatterns,
          configFiles: tech.configFiles,
          projectContexts: tech.projectContexts,
          relatedTechs: tech.relatedTechs,
        }));

      if (toCreate.length > 0) {
        await tx.technologyStack.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }

      const toUpdate = evidence.filter((tech) =>
        existingSet.has(`${tech.category}-${tech.name}`),
      );

      // Parallelize update operations within transaction
      await Promise.all(
        toUpdate.map((tech) =>
          tx.technologyStack.update({
            where: {
              userProfileId_category_name: {
                userProfileId,
                category: tech.category,
                name: tech.name,
              },
            },
            data: {
              version: tech.version,
              masteryLevel: this.calculateMasteryLevel(tech),
              implementationScore: this.calculateImplementationScore(tech),
              usageCount: tech.usageCount,
              totalDays: tech.totalDays,
              weeksActive: tech.weeksActive,
              lastUsed: tech.lastUsed,
              evidenceTypes: tech.evidenceTypes,
              codePatterns: tech.codePatterns,
              configFiles: tech.configFiles,
              projectContexts: tech.projectContexts,
              relatedTechs: tech.relatedTechs,
            },
          }),
        ),
      );
    });
  }

  private calculateMasteryLevel(evidence: TechnologyEvidence): MasteryLevel {
    const score = this.calculateImplementationScore(evidence);
    if (score < this.MENTIONED_THRESHOLD) return MasteryLevel.MENTIONED;
    if (score < this.USED_THRESHOLD) return MasteryLevel.USED;
    if (score < this.PROFICIENT_THRESHOLD) return MasteryLevel.PROFICIENT;
    return MasteryLevel.EXPERT;
  }

  private calculateImplementationScore(evidence: TechnologyEvidence): number {
    let score = 0;

    const usageFrequency = Math.min(
      (evidence.usageCount / this.USAGE_FREQUENCY_DIVISOR) *
        this.USAGE_FREQUENCY_MAX_SCORE,
      this.USAGE_FREQUENCY_MAX_SCORE,
    );
    score += usageFrequency;

    const timeSpan = Math.min(
      (evidence.weeksActive / this.WEEKS_ACTIVE_DIVISOR) *
        this.TIME_SPAN_MAX_SCORE,
      this.TIME_SPAN_MAX_SCORE,
    );
    score += timeSpan;

    const consistency =
      evidence.weeksActive > 0
        ? Math.min(
            (evidence.usageCount / evidence.weeksActive) *
              this.CONSISTENCY_MULTIPLIER,
            this.CONSISTENCY_MAX_SCORE,
          )
        : 0;
    score += consistency;

    const evidenceQuality =
      evidence.evidenceTypes.length * this.EVIDENCE_QUALITY_MULTIPLIER;
    score += Math.min(evidenceQuality, this.EVIDENCE_QUALITY_MAX_SCORE);

    if (
      evidence.usageCount < this.MIN_USAGE_FOR_LOW_SCORE ||
      evidence.weeksActive < this.MIN_WEEKS_FOR_LOW_SCORE
    ) {
      score = Math.min(score, this.LOW_USAGE_MAX_SCORE);
    }

    return Math.round(Math.min(score, 100));
  }
}
