import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  AnalysisPersistedEvent,
  EngineeringLeadershipScore,
} from '@verified-prof/shared';
import { ArchitecturalLayerService } from './architectural-layer.service';
import { EffortDistributionService } from './effort-distribution.service';

@Injectable()
export class LeadershipService {
  private readonly logger = new Logger(LeadershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly architecturalLayerService: ArchitecturalLayerService,
    private readonly effortDistributionService: EffortDistributionService,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    this.logger.log(
      `Engineering Leadership generation triggered for user ${event.userId}`,
    );

    try {
      this.logger.log(
        `Engineering Leadership generated successfully for user ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate Engineering Leadership for user ${event.userId}`,
        error,
      );
    }
  }

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

    const result = {
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

    return result;
  }

  private getEmptyScore(): EngineeringLeadershipScore {
    return {
      architecturalLayers: [],
      effortDistribution: [],
    };
  }
}
