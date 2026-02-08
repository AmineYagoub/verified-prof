import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import {
  CommitDetails,
  JOB_EVENTS,
  AnalysisPersistedEvent,
  TagSummary,
  JobStageProgressEvent,
  JobStage,
  JobStatus,
} from '@verified-prof/shared';
import { PrismaService } from '@verified-prof/prisma';
import { ConfigFileDetectorService } from './config-file-detector.service';
import { InfrastructureDetectorService } from './infrastructure-detector.service';
import { AstCodeDetectorService } from '../../orchestration/ast-code-detector.service';
import { TechEvidenceAggregatorService } from './tech-evidence-aggregator.service';
import { DetectedTechnology } from '../types/tech-detection.types';
import { TechStackPersisterService } from './tech-stack-persister.service';

@Injectable()
export class TechDetectionService {
  private readonly logger = new Logger(TechDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configFileDetector: ConfigFileDetectorService,
    private readonly infrastructureDetector: InfrastructureDetectorService,
    private readonly astCodeDetector: AstCodeDetectorService,
    private readonly evidenceAggregator: TechEvidenceAggregatorService,
    private readonly stackPersister: TechStackPersisterService,
    private readonly em: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.ANALYSIS_PERSISTED)
  async handleAnalysisPersisted(event: AnalysisPersistedEvent) {
    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        event.userId,
        JobStatus.RUNNING,
        JobStage.TECH_DETECTION,
        61,
      ),
    );

    try {
      const userProfile = await this.prisma.client.userProfile.findUnique({
        where: { userId: event.userId },
        select: { id: true },
      });
      if (!userProfile) {
        this.logger.warn(
          `No user profile found for user ${event.userId}, skipping tech detection`,
        );
        return;
      }
      const commits = this.groupByCommit(event.tagSummaries);
      await this.detectAllTechnologies(commits, userProfile.id);

      this.em.emit(
        JOB_EVENTS.JOB_STAGE_PROGRESS,
        new JobStageProgressEvent(
          event.userId,
          JobStatus.RUNNING,
          JobStage.TECH_DETECTION,
          65,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Technology detection failed for user ${event.userId}`,
        error,
      );
    }
  }

  private groupByCommit(
    tagSummaries: Array<{
      repoFullName: string;
      commitSha: string;
      filePath: string;
      tagSummary: TagSummary;
    }>,
  ): CommitDetails[] {
    const commitMap = new Map<string, CommitDetails>();

    for (const summary of tagSummaries) {
      if (!commitMap.has(summary.commitSha)) {
        commitMap.set(summary.commitSha, {
          sha: summary.commitSha,
          contents: [],
          author: undefined,
          stats: undefined,
          parentShas: [],
          message: '',
        });
      }

      const commit = commitMap.get(summary.commitSha);
      if (!commit) continue;
      const ext = summary.filePath.substring(summary.filePath.lastIndexOf('.'));

      commit.contents.push({
        filename: summary.filePath,
        content: '',
        sha: '',
        extension: ext,
        changes: 0,
        additions: 0,
        deletions: 0,
        repository: summary.repoFullName,
        fileType: this.determineFileType(summary.filePath),
      });
    }

    return Array.from(commitMap.values());
  }

  private determineFileType(
    filePath: string,
  ): 'code' | 'config' | 'infrastructure' | undefined {
    const basename = filePath.split('/').pop() || '';

    const configFiles = [
      'package.json',
      'tsconfig.json',
      'schema.prisma',
      'jest.config',
      'vite.config',
      'webpack.config',
    ];

    const infrastructurePatterns = [
      /^\.github\/workflows\//,
      /docker-compose/i,
      /^Dockerfile/,
    ];
    if (configFiles.some((cf) => basename.includes(cf))) {
      return 'config';
    }
    if (infrastructurePatterns.some((pattern) => pattern.test(filePath))) {
      return 'infrastructure';
    }
    return 'code';
  }

  async detectAllTechnologies(
    commits: CommitDetails[],
    userProfileId: string,
  ): Promise<void> {
    const detectedTechs: DetectedTechnology[] = [];
    const commitDates: Date[] = [];

    for (const commit of commits) {
      if (commit.author?.date) {
        commitDates.push(new Date(commit.author.date));
      }
      for (const file of commit.contents) {
        if (file.fileType === 'config') {
          detectedTechs.push(
            ...(await this.configFileDetector.detectFromConfigFile(file)),
          );
        } else if (file.fileType === 'infrastructure') {
          detectedTechs.push(
            ...(await this.infrastructureDetector.detectFromInfrastructure(
              file,
            )),
          );
        } else if (file.fileType === 'code') {
          detectedTechs.push(
            ...(await this.astCodeDetector.detectFromCode(file)),
          );
        }
      }
    }
    const evidence = this.evidenceAggregator.aggregateEvidence(
      detectedTechs,
      commitDates,
    );
    await this.stackPersister.persistTechnologyStack(userProfileId, evidence);
  }
}
