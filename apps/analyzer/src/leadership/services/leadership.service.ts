import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import {
  EngineeringLeadershipScore,
} from '@verified-prof/shared';
import { ArchitecturalLayerService } from './architectural-layer.service';
import { EffortDistributionService } from './effort-distribution.service';

/**
 * Leadership Service - Aggregates engineering leadership data.
 *
 * Note: The actual data generation is handled by:
 * - ArchitecturalLayerService (listens to JOB_EVENTS.ANALYSIS_PERSISTED)
 * - EffortDistributionService (listens to JOB_EVENTS.ANALYSIS_PERSISTED)
 *
 * This service only aggregates the data for retrieval via the API.
 */
@Injectable()
export class LeadershipService {
  private readonly logger = new Logger(LeadershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly architecturalLayerService: ArchitecturalLayerService,
    private readonly effortDistributionService: EffortDistributionService,
  ) {}

  /**
   * Get the complete engineering leadership score for a user.
   * This aggregates data from both architectural layers and effort distribution.
   */
  async getEngineeringLeadership(
    userId: string,
  ): Promise<EngineeringLeadershipScore> {
    this.logger.log(`Fetching engineering leadership for user ${userId}`);

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      this.logger.warn(`No profile found for user ${userId}`);
      return this.getEmptyScore();
    }

    const [architecturalLayers, effortDistribution] = await Promise.all([
      this.architecturalLayerService.get(userId),
      this.effortDistributionService.get(userId),
    ]);

    this.logger.log(
      `Retrieved ${architecturalLayers.length} layers and ${effortDistribution.length} effort distributions for user ${userId}`,
    );

    return {
      architecturalLayers,
      effortDistribution: effortDistribution.map((dist) => ({
        weekStart: dist.weekStart,
        categories: {
          features: dist.features,
          fixes: dist.fixes,
          refactors: dist.refactors,
          tests: dist.tests,
          documentation: dist.documentation,
          infrastructure: dist.infrastructure,
          performance: dist.performance,
          security: dist.security,
        },
      })),
    };
  }

  private getEmptyScore(): EngineeringLeadershipScore {
    return {
      architecturalLayers: [],
      effortDistribution: [],
    };
  }
}
