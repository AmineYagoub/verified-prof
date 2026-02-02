import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@verified-prof/prisma';
import {
  JOB_EVENTS,
  MissionGenerationRequestedEvent,
} from '@verified-prof/shared';
import { GeminiService } from './gemini-client.service';
import { generateMissionSummaryPrompt } from './prompts/mission-summary.prompt';

interface AIGeneratedMission {
  commitSha: string;
  impact: 'Infrastructure' | 'Feature' | 'Refactor' | 'Fix';
  title: string;
  summary: string;
  achievements: string[];
  architecturalFeat: string | null;
  domainContext: string;
}

@Injectable()
export class MissionAiService {
  private readonly logger = new Logger(MissionAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  @OnEvent(JOB_EVENTS.MISSION_GENERATION_REQUESTED)
  async handleMissionGenerationRequested(
    event: MissionGenerationRequestedEvent,
  ) {
    const { userProfileId, weekStart, commitContexts } = event;

    this.logger.log(
      `Generating AI missions for ${commitContexts.length} work sessions`,
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
          week: weekStart,
          date,
          impact: aiMission.impact,
          title: aiMission.title,
          architecturalFeat: aiMission.architecturalFeat,
          summary: aiMission.summary,
          achievements: aiMission.achievements,
          domainContext: aiMission.domainContext,
          commitCount,
          isHeroMission: commitCount > 5 || !!aiMission.architecturalFeat,
        };
      });

      for (const mission of missions) {
        await this.prisma.client.mission.upsert({
          where: {
            userProfileId_week_date: {
              userProfileId,
              week: mission.week,
              date: mission.date,
            },
          },
          create: {
            ...mission,
            userProfileId,
          },
          update: mission,
        });
      }

      this.logger.log(
        `Persisted ${missions.length} AI-generated missions for week ${weekStart}`,
      );
    } catch (error) {
      this.logger.error('AI mission generation failed:', error);
    }
  }
}
