'use client';
import { useProfile } from '@verified-prof/web/hooks/use-profile';
import { CoreMetricsDashboard } from '../profile/core-metrics/CoreMetricsDashboard';
import { EngineeringLeadership } from '../profile/leadership/EngineeringLeadership';
import { MissionLine } from '../profile/missions/MissionLine';
import { ProfileHero } from '../profile/user-info/ProfileHero';
import { DashboardLayout } from './DashboardLayout';
import { ProfileService } from '@verified-prof/web/services';
import { useState } from 'react';
import { useJobProgress } from '@verified-prof/web/hooks';
import { JobStage, JobStatus } from '@verified-prof/web/types';

const STAGE_LABELS: Record<JobStage, string> = {
  [JobStage.FETCHING_COMMITS]: 'Fetching commits...',
  [JobStage.ANALYZING_COMMITS]: 'Analyzing commits...',
  [JobStage.PERSISTING_DATA]: 'Persisting data...',
  [JobStage.GENERATING_MISSIONS]: 'Generating missions...',
  [JobStage.AI_ANALYSIS]: 'Running AI analysis...',
  [JobStage.TECH_STACK_DNA]: 'Analyzing tech stack DNA...',
  [JobStage.TECH_DETECTION]: 'Detecting technologies...',
  [JobStage.ARCHITECTURE_LAYER]: 'Analyzing architecture layers...',
  [JobStage.EFFORT_DISTRIBUTION]: 'Calculating effort distribution...',
};

const DashboardPage = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(false);
  const {
    data: jobProgressData,
    isLoading: jobProgressLoading,
    error: jobProgressError,
  } = useJobProgress();
  const { data, isLoading, error } = useProfile(
    userId,
    true,
    jobProgressData?.status === JobStatus.COMPLETED,
  );
  const currentStageLabel = jobProgressData?.currentStage
    ? STAGE_LABELS[jobProgressData?.currentStage]
    : 'Initializing...';

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      await ProfileService.triggerAnalysis();
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || jobProgressLoading) {
    return (
      <main className="drawer-content flex flex-col items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="mt-4 text-base-content/70">Loading profile...</p>
      </main>
    );
  }

  if (error || jobProgressError) {
    return (
      <main className="drawer-content flex flex-col items-center justify-center min-h-screen px-4">
        <div className="alert alert-error max-w-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Error loading profile</h3>
            <div className="text-xs">
              {error || 'Failed to load profile data'}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!jobProgressData) {
    return (
      <main className="drawer-content flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">No Profile Yet</h2>
          <p className="text-base-content/70 mb-8">
            Start your first analysis to generate your engineering profile
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={triggerAnalysis}
            disabled={loading}
          >
            Start Analysis
          </button>
        </div>
      </main>
    );
  }

  if (jobProgressData.status === JobStatus.FAILED) {
    return (
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-bold">Analysis Failed</h3>
          <div className="text-xs">
            {jobProgressData.error || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  if (jobProgressData.status !== JobStatus.COMPLETED) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card-body max-w-md mx-auto">
          <h2 className="card-title">Analysis Progress</h2>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-70">{currentStageLabel}</span>
              <span className="text-sm font-bold">
                {jobProgressData.progress}%
              </span>
            </div>

            <progress
              className="progress progress-primary w-full"
              value={jobProgressData.progress}
              max="100"
            />
          </div>

          {jobProgressData.status === JobStatus.RUNNING && (
            <div className="flex items-center gap-2 mt-2">
              <span className="loading loading-spinner loading-sm" />
              <span className="text-xs opacity-70">Processing...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <ProfileHero
        userName={data.name}
        userImage={data.image}
        bio={data.bio}
        isDashboard
      />
      <CoreMetricsDashboard
        coreMetrics={data.coreMetrics}
        dominantLanguages={data.techStackDNA.dominantLanguages}
      />
      <MissionLine missionTimeline={data.missionTimeline} />
      <EngineeringLeadership userId={data.userId} />
    </DashboardLayout>
  );
};

export default DashboardPage;
