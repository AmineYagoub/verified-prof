import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  MissionGenerationRequestedEvent,
  JobStageProgressEvent,
  JobStage,
  JobStatus,
} from '@verified-prof/shared';
import { GeminiService } from './gemini-client.service';
import { generateMissionSummaryPrompt } from './prompts/mission-summary.prompt';

interface AIGeneratedMission {
  commitSha: string;
  impact: 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix';
  title: string;
  summary: string;
  achievements: string[];
  patterns: string[];
  architecturalFeat: string | null;
  domainContext: string;
}

@Injectable()
export class MissionAiService {
  private readonly logger = new Logger(MissionAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly em: EventEmitter2,
  ) {}

  @OnEvent(JOB_EVENTS.MISSION_GENERATION_REQUESTED)
  async handleMissionGenerationRequested(
    event: MissionGenerationRequestedEvent,
  ) {
    const { userProfileId, userId, commitContexts } = event;

    this.em.emit(
      JOB_EVENTS.JOB_STAGE_PROGRESS,
      new JobStageProgressEvent(
        userId,
        JobStatus.RUNNING,
        JobStage.GENERATING_MISSIONS,
        50,
      ),
    );

    const prompt = generateMissionSummaryPrompt(commitContexts);
    try {
      const fullPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
      const aiMissions = await this.gemini.generateJSON<AIGeneratedMission[]>(
        fullPrompt,
        prompt.jsonSchema,
      );
      if (!aiMissions || aiMissions.length === 0) {
        this.logger.warn('AI returned no missions');
        return;
      }
      const commitContextMap = new Map(
        commitContexts.map((ctx) => [ctx.commitSha, ctx]),
      );

      const missions = aiMissions.map((aiMission) => {
        const context = commitContextMap.get(aiMission.commitSha);
        const date = context?.date || new Date();
        const commitCount = context?.commitCount || 1;
        return {
          date,
          impact: aiMission.impact,
          title: aiMission.title,
          architecturalFeat: aiMission.architecturalFeat,
          summary: aiMission.summary,
          achievements: aiMission.achievements,
          patterns: aiMission.patterns,
          domainContext: aiMission.domainContext,
          commitCount,
          isHeroMission: commitCount > 5 || !!aiMission.architecturalFeat,
        };
      });

      this.logger.log(
        `Preparing to persist ${missions.length} AI-generated missions`,
        JSON.stringify(missions, null, 2),
      );

      await this.prisma.client.mission.createMany({
        data: missions.map((mission) => ({
          userProfileId,
          date: mission.date,
          impact: mission.impact,
          title: mission.title,
          architecturalFeat: mission.architecturalFeat,
          summary: mission.summary,
          achievements: mission.achievements,
          patterns: mission.patterns,
          domainContext: mission.domainContext,
          commitCount: mission.commitCount,
          isHeroMission: mission.isHeroMission,
        })),
      });

      this.logger.log(`Persisted ${missions.length} AI-generated missions`);

      this.em.emit(
        JOB_EVENTS.JOB_STAGE_PROGRESS,
        new JobStageProgressEvent(
          userId,
          JobStatus.RUNNING,
          JobStage.GENERATING_MISSIONS,
          54,
        ),
      );
    } catch (error) {
      this.logger.error('AI mission generation failed:', error);
    }
  }
}
