import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  ArchitecturalLayerRequestedEvent,
} from '@verified-prof/shared';
import { LeadershipAiService } from './leadership-ai.service';

@Injectable()
export class ArchitecturalLayerAiService {
  private readonly logger = new Logger(ArchitecturalLayerAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadershipAi: LeadershipAiService,
  ) {}

  @OnEvent(JOB_EVENTS.ARCHITECTURAL_LAYER_REQUESTED, { async: true })
  async handleArchitecturalLayerRequested(
    event: ArchitecturalLayerRequestedEvent,
  ): Promise<void> {
    const { userId, userProfileId, fileMetadata } = event;

    this.logger.log(`Generating architectural layers for user ${userId}`);

    const layers =
      await this.leadershipAi.groupArchitecturalLayers(fileMetadata);

    await this.persistLayers(userProfileId, layers);

    this.logger.log(
      `Architectural layers persisted for user ${userId} (${layers.length} layers)`,
    );
  }

  private async persistLayers(
    userProfileId: string,
    layers: Array<{ layer: string; description: string; files: string[] }>,
  ): Promise<void> {
    const totalFiles = layers.reduce((sum, l) => sum + l.files.length, 0);

    await this.prisma.client.architecturalLayer.createMany({
      data: layers.map((layer) => {
        const involvement =
          totalFiles > 0 ? (layer.files.length / totalFiles) * 100 : 0;
        const stabilityRate = this.calculateStabilityRate(layer.files.length);

        return {
          userProfileId,
          layer: layer.layer,
          description: layer.description,
          fileCount: layer.files.length,
          stabilityRate,
          involvement: Math.round(involvement),
        };
      }),
    });
  }

  private calculateStabilityRate(fileCount: number): number {
    if (fileCount === 0) return 100;
    if (fileCount <= 5) return 95;
    if (fileCount <= 20) return 85;
    if (fileCount <= 50) return 75;
    if (fileCount <= 100) return 65;
    return 50;
  }
}
