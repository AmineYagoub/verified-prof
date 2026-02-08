'use client';

import { JobStatus, JobStage } from '../../types';
import { useJobProgress } from '../../hooks/use-job-progress';

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

export const JobProgress = () => {
  const { data, isLoading, error } = useJobProgress();

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
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
        <span>{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>No job found. Start an analysis to see progress.</span>
      </div>
    );
  }

  if (data.status === JobStatus.FAILED) {
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
          <div className="text-xs">{data.error || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  const currentStageLabel = data.currentStage
    ? STAGE_LABELS[data.currentStage]
    : 'Initializing...';

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Analysis Progress</h2>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-70">{currentStageLabel}</span>
            <span className="text-sm font-bold">{data.progress}%</span>
          </div>

          <progress
            className="progress progress-primary w-full"
            value={data.progress}
            max="100"
          />
        </div>

        {data.status === JobStatus.RUNNING && (
          <div className="flex items-center gap-2 mt-2">
            <span className="loading loading-spinner loading-sm" />
            <span className="text-xs opacity-70">Processing...</span>
          </div>
        )}

        {data.status === JobStatus.COMPLETED && (
          <div className="alert alert-success mt-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Analysis completed successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};
