import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  JobType,
  JOB_EVENTS,
  JobStartedEvent,
  JobCompletedEvent,
  JobFailedEvent,
  AnalysisTriggeredEvent,
  QualityAnalysisCompletedEvent,
  AchievementExtractionCompletedEvent,
  BadgeQualificationCompletedEvent,
  SkillInferenceCompletedEvent,
} from '@verified-prof/shared';
import { ProgressTrackingService } from './progress-tracking.service';
import { QualityService } from '../../quality/quality.service';
import { AchievementAnalysisService } from '../../quality/services/achievement-analysis.service';
import { BadgeQualificationService } from '../../badges/services/badge-qualification.service';
import { SkillInferenceService } from '../../skills/services/skill-inference.service';

@Injectable()
export class JobOrchestrationService {
  private readonly logger = new Logger(JobOrchestrationService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly progressTracking: ProgressTrackingService,
    private readonly qualityService: QualityService,
    private readonly achievementAnalysis: AchievementAnalysisService,
    private readonly badgeQualification: BadgeQualificationService,
    private readonly skillInference: SkillInferenceService,
  ) {}

  async triggerAnalysis(userId: string, plan: 'FREE' | 'PREMIUM' = 'FREE') {
    this.logger.log(`Triggering analysis for user ${userId} with plan ${plan}`);
    this.eventEmitter.emit(
      JOB_EVENTS.ANALYSIS_TRIGGERED,
      new AnalysisTriggeredEvent(userId, plan),
    );
  }

  @OnEvent(JOB_EVENTS.ANALYSIS_TRIGGERED)
  async handleAnalysisTriggered(event: AnalysisTriggeredEvent) {
    const { userId, plan } = event;
    this.logger.log(`Starting analysis pipeline for user ${userId}`);

    const qualityJobId = await this.startQualityAnalysis(userId, plan);
    this.logger.log(`Quality analysis job completed: ${qualityJobId}`);
  }

  private async startQualityAnalysis(
    userId: string,
    plan: 'FREE' | 'PREMIUM',
  ): Promise<string> {
    const job = await this.progressTracking.createJob(
      userId,
      JobType.QUALITY_ANALYSIS,
      { plan },
    );

    this.eventEmitter.emit(
      JOB_EVENTS.JOB_STARTED,
      new JobStartedEvent(job.jobId, userId, JobType.QUALITY_ANALYSIS, {
        plan,
      }),
    );

    try {
      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Analyzing repositories',
        progress: 10,
      });

      const result = await this.qualityService.analyzeUserRepos(userId, plan);

      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Completed',
        progress: 100,
      });

      await this.progressTracking.completeJob(job.jobId, result);

      const totalCommits = result.repositories.reduce(
        (sum, repo) =>
          sum +
          ((repo.result as { commitsAnalyzed?: number })?.commitsAnalyzed || 0),
        0,
      );

      this.eventEmitter.emit(
        JOB_EVENTS.QUALITY_ANALYSIS_COMPLETED,
        new QualityAnalysisCompletedEvent(
          job.jobId,
          userId,
          result.repositories.length,
          totalCommits,
        ),
      );

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_COMPLETED,
        new JobCompletedEvent(
          job.jobId,
          userId,
          JobType.QUALITY_ANALYSIS,
          result,
        ),
      );

      return job.jobId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.progressTracking.failJob(job.jobId, errorMessage);

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_FAILED,
        new JobFailedEvent(
          job.jobId,
          userId,
          JobType.QUALITY_ANALYSIS,
          errorMessage,
        ),
      );

      throw error;
    }
  }

  @OnEvent(JOB_EVENTS.QUALITY_ANALYSIS_COMPLETED)
  async handleQualityAnalysisCompleted(event: QualityAnalysisCompletedEvent) {
    const { userId, repositoryCount, commitCount } = event;
    this.logger.log(
      `Quality analysis completed for user ${userId}: ${repositoryCount} repos, ${commitCount} commits`,
    );

    if (commitCount > 0) {
      this.logger.log(`Starting achievement extraction for user ${userId}`);
      await this.startAchievementExtraction(userId);
    } else {
      this.logger.log(
        `No commits to analyze for user ${userId}, skipping achievement extraction`,
      );
    }
  }

  private async startAchievementExtraction(userId: string): Promise<string> {
    const job = await this.progressTracking.createJob(
      userId,
      JobType.ACHIEVEMENT_EXTRACTION,
    );

    this.eventEmitter.emit(
      JOB_EVENTS.JOB_STARTED,
      new JobStartedEvent(job.jobId, userId, JobType.ACHIEVEMENT_EXTRACTION),
    );

    try {
      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Extracting achievements from pull requests',
        progress: 20,
      });

      const result = await this.achievementAnalysis.analyzeUserAchievements(
        userId,
        { maxReposPerUser: 10, maxPRsPerRepo: 20 },
      );

      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Completed',
        progress: 100,
      });

      await this.progressTracking.completeJob(job.jobId, result);

      this.eventEmitter.emit(
        JOB_EVENTS.ACHIEVEMENT_EXTRACTION_COMPLETED,
        new AchievementExtractionCompletedEvent(
          job.jobId,
          userId,
          result.totalAchievements,
        ),
      );

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_COMPLETED,
        new JobCompletedEvent(
          job.jobId,
          userId,
          JobType.ACHIEVEMENT_EXTRACTION,
          result,
        ),
      );

      return job.jobId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.progressTracking.failJob(job.jobId, errorMessage);

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_FAILED,
        new JobFailedEvent(
          job.jobId,
          userId,
          JobType.ACHIEVEMENT_EXTRACTION,
          errorMessage,
        ),
      );

      throw error;
    }
  }

  @OnEvent(JOB_EVENTS.ACHIEVEMENT_EXTRACTION_COMPLETED)
  async handleAchievementExtractionCompleted(
    event: AchievementExtractionCompletedEvent,
  ) {
    const { userId, achievementCount } = event;
    this.logger.log(
      `Achievement extraction completed for user ${userId}: ${achievementCount} achievements`,
    );

    this.logger.log(`Starting badge qualification for user ${userId}`);
    await this.startBadgeQualification(userId);
  }

  private async startBadgeQualification(userId: string): Promise<string> {
    const job = await this.progressTracking.createJob(
      userId,
      JobType.BADGE_CALCULATION,
    );

    this.eventEmitter.emit(
      JOB_EVENTS.JOB_STARTED,
      new JobStartedEvent(job.jobId, userId, JobType.BADGE_CALCULATION),
    );

    try {
      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Evaluating badge criteria',
        progress: 30,
      });

      const result = await this.badgeQualification.evaluateUserBadges(userId);

      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Completed',
        progress: 100,
      });

      await this.progressTracking.completeJob(job.jobId, result);

      this.eventEmitter.emit(
        JOB_EVENTS.BADGE_QUALIFICATION_COMPLETED,
        new BadgeQualificationCompletedEvent(
          job.jobId,
          userId,
          result.newBadgesEarned,
          result.totalBadges,
        ),
      );

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_COMPLETED,
        new JobCompletedEvent(
          job.jobId,
          userId,
          JobType.BADGE_CALCULATION,
          result,
        ),
      );

      return job.jobId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.progressTracking.failJob(job.jobId, errorMessage);

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_FAILED,
        new JobFailedEvent(
          job.jobId,
          userId,
          JobType.BADGE_CALCULATION,
          errorMessage,
        ),
      );

      throw error;
    }
  }

  @OnEvent(JOB_EVENTS.BADGE_QUALIFICATION_COMPLETED)
  async handleBadgeQualificationCompleted(
    event: BadgeQualificationCompletedEvent,
  ) {
    const { userId, newBadgesEarned, totalBadges } = event;
    this.logger.log(
      `Badge qualification completed for user ${userId}: ${newBadgesEarned} new badges (${totalBadges} total)`,
    );

    this.logger.log(`Starting skill inference for user ${userId}`);
    await this.startSkillInference(userId);
  }

  private async startSkillInference(userId: string): Promise<string> {
    const job = await this.progressTracking.createJob(
      userId,
      JobType.SKILL_INFERENCE,
    );

    this.eventEmitter.emit(
      JOB_EVENTS.JOB_STARTED,
      new JobStartedEvent(job.jobId, userId, JobType.SKILL_INFERENCE),
    );

    try {
      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Inferring skills from achievements',
        progress: 40,
      });

      const result = await this.skillInference.inferUserSkills(userId);

      await this.progressTracking.updateProgress(job.jobId, {
        currentStep: 'Completed',
        progress: 100,
      });

      await this.progressTracking.completeJob(job.jobId, result);

      this.eventEmitter.emit(
        JOB_EVENTS.SKILL_INFERENCE_COMPLETED,
        new SkillInferenceCompletedEvent(
          job.jobId,
          userId,
          result.newSkillsAdded,
          result.totalSkills,
        ),
      );

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_COMPLETED,
        new JobCompletedEvent(
          job.jobId,
          userId,
          JobType.SKILL_INFERENCE,
          result,
        ),
      );

      return job.jobId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.progressTracking.failJob(job.jobId, errorMessage);

      this.eventEmitter.emit(
        JOB_EVENTS.JOB_FAILED,
        new JobFailedEvent(
          job.jobId,
          userId,
          JobType.SKILL_INFERENCE,
          errorMessage,
        ),
      );

      throw error;
    }
  }

  @OnEvent(JOB_EVENTS.SKILL_INFERENCE_COMPLETED)
  async handleSkillInferenceCompleted(event: SkillInferenceCompletedEvent) {
    const { userId, newSkillsAdded, totalSkills } = event;
    this.logger.log(
      `Skill inference completed for user ${userId}: ${newSkillsAdded} new skills (${totalSkills} total)`,
    );

    this.logger.log(`✅ Analysis pipeline completed for user ${userId}`);
  }
}
