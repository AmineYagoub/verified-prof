import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  AnalysisPersistedEvent,
  ArchitecturalLayerRequestedEvent,
  JOB_EVENTS,
} from '@verified-prof/shared';

@Injectable()
export class ArchitecturalLayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED, { async: true })
  async handleAnalysisPersisted(event: AnalysisPersistedEvent): Promise<void> {
    const { userId, codeOwnership, commitMetadata } = event;
    if (!userId || !codeOwnership || codeOwnership.length === 0) {
      return;
    }
    await this.prepareAndEmit(userId, codeOwnership, commitMetadata || []);
  }

  private async prepareAndEmit(
    userId: string,
    codeOwnership: Array<{
      filePath: string;
      totalCommits: number;
      authorCommits: number;
      ownershipPercentage: number;
    }>,
    commitMetadata: Array<{ authorDate: string }>,
  ): Promise<void> {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      return;
    }
    const fileMetadata = this.prepareFileMetadata(
      codeOwnership,
      commitMetadata,
    );
    const requestEvent: ArchitecturalLayerRequestedEvent = {
      userId,
      userProfileId: userProfile.id,
      fileMetadata,
    };

    this.eventEmitter.emit(
      JOB_EVENTS.ARCHITECTURAL_LAYER_REQUESTED,
      requestEvent,
    );
  }

  private prepareFileMetadata(
    codeOwnership: Array<{
      filePath: string;
      totalCommits: number;
      authorCommits: number;
      ownershipPercentage: number;
    }>,
    commitMetadata: Array<{ authorDate: string }>,
  ): Array<{ path: string; editCount: number; lastModified: string }> {
    const latestDate =
      commitMetadata.length > 0
        ? new Date(
            Math.max(
              ...commitMetadata.map((c) => new Date(c.authorDate).getTime()),
            ),
          ).toISOString()
        : new Date().toISOString();

    return codeOwnership.map((file) => ({
      path: file.filePath,
      editCount: file.authorCommits,
      lastModified: latestDate,
    }));
  }

  async get(userId: string) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });
    if (!userProfile) {
      return [];
    }
    return this.prisma.client.architecturalLayer.findMany({
      where: { userProfileId: userProfile.id },
      select: {
        layer: true,
        description: true,
        fileCount: true,
        stabilityRate: true,
        involvement: true,
      },
      orderBy: { fileCount: 'desc' },
    });
  }
}
