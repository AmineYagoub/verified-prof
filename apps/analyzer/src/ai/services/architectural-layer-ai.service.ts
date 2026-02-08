import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { JobStage, JobStatus, PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  ArchitecturalLayerRequestedEvent,
  JobStageProgressEvent,
} from '@verified-prof/shared';
import { LeadershipAiService } from './leadership-ai.service';

@Injectable()
export class ArchitecturalLayerAiService {
  private readonly logger = new Logger(ArchitecturalLayerAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadershipAi: LeadershipAiService,
    private readonly em: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ARCHITECTURAL_LAYER_REQUESTED, { async: true })
  async handleArchitecturalLayerRequested(
    event: ArchitecturalLayerRequestedEvent,
  ): Promise<void> {
    const { userId, userProfileId, fileMetadata } = event;

    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        userId,
        JobStatus.RUNNING,
        JobStage.ARCHITECTURE_LAYER,
        77,
      ),
    );

    this.logger.log(`Generating architectural layers for user ${userId}`);

    const layers =
      await this.leadershipAi.groupArchitecturalLayers(fileMetadata);

    await this.persistLayers(userProfileId, layers);

    this.logger.log(
      `Architectural layers persisted for user ${userId} (${layers.length} layers)`,
    );

    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        userId,
        JobStatus.COMPLETED,
        JobStage.ARCHITECTURE_LAYER,
        100,
      ),
    );
  }

  private async persistLayers(
    userProfileId: string,
    layers: Array<{ layer: string; description: string; fileCount: number }>,
  ): Promise<void> {
    const totalFiles = layers.reduce((sum, l) => sum + l.fileCount, 0);

    await this.prisma.client.architecturalLayer.createMany({
      data: layers.map((layer) => {
        const involvement =
          totalFiles > 0 ? (layer.fileCount / totalFiles) * 100 : 0;
        const stabilityRate = this.calculateStabilityRate(layer.fileCount);

        return {
          userProfileId,
          layer: layer.layer,
          description: layer.description,
          fileCount: layer.fileCount,
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
