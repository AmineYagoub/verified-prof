'use client';

import { AnalysisJob } from '@verified-prof/web/services';

interface ProgressStateProps {
  job: AnalysisJob | null | undefined;
  progress: number;
  currentStep: string | undefined;
  isFailed: boolean;
}

export const ProgressState = ({
  job,
  progress,
  currentStep,
  isFailed,
}: ProgressStateProps) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title text-3xl mb-6">Analysis in Progress 🚀</h2>

      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <div
            className="badge badge-lg"
            data-status={job?.status || 'PENDING'}
          >
            {job?.status || 'PENDING'}
          </div>
          <span className="text-sm text-base-content/70">
            {currentStep || 'Initializing...'}
          </span>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-lg font-semibold">Progress</span>
            <span className="text-lg font-bold">{progress}%</span>
          </div>
          <progress
            className="progress progress-primary w-full h-4"
            value={progress}
            max="100"
          ></progress>
        </div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div
            className={`stat bg-base-200 rounded-box ${progress >= 25 ? 'ring-2 ring-primary' : 'opacity-50'}`}
          >
            <div className="stat-title">Step 1</div>
            <div className="stat-value text-2xl">📡</div>
            <div className="stat-desc">Fetching Data</div>
          </div>
          <div
            className={`stat bg-base-200 rounded-box ${progress >= 50 ? 'ring-2 ring-primary' : 'opacity-50'}`}
          >
            <div className="stat-title">Step 2</div>
            <div className="stat-value text-2xl">🔍</div>
            <div className="stat-desc">Analyzing Quality</div>
          </div>
          <div
            className={`stat bg-base-200 rounded-box ${progress >= 75 ? 'ring-2 ring-primary' : 'opacity-50'}`}
          >
            <div className="stat-title">Step 3</div>
            <div className="stat-value text-2xl">🤖</div>
            <div className="stat-desc">AI Processing</div>
          </div>
          <div
            className={`stat bg-base-200 rounded-box ${progress >= 95 ? 'ring-2 ring-primary' : 'opacity-50'}`}
          >
            <div className="stat-title">Step 4</div>
            <div className="stat-value text-2xl">✨</div>
            <div className="stat-desc">Generating Results</div>
          </div>
        </div>

        {/* Job Info */}
        {job && (
          <div className="alert alert-info mt-6">
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
            <div>
              <div className="font-bold">This may take a few minutes</div>
              <div className="text-sm">
                Started {new Date(job.startedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {isFailed && job?.errorMessage && (
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
              <div className="font-bold">Analysis Failed</div>
              <div className="text-sm">{job.errorMessage}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
