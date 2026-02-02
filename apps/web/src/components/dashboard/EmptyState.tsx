'use client';

interface EmptyStateProps {
  onStartAnalysis: () => void;
  isLoading: boolean;
}

export const EmptyState = ({ onStartAnalysis, isLoading }: EmptyStateProps) => (
  <div className="hero min-h-[70vh]">
    <div className="hero-content text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold mb-8">
          Welcome to Verified Prof! 👋
        </h1>
        <p className="text-xl mb-8 text-base-content/70">
          Start analyzing your GitHub activity to verify your professional
          skills and achievements.
        </p>

        <div className="card bg-base-100 shadow-2xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center mb-4">
              What happens when you analyze?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-bold mb-2">Quality Metrics</h3>
                <p className="text-sm text-base-content/70">
                  Get detailed quality scores for discipline, clarity, testing,
                  and impact
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="font-bold mb-2">Achievements</h3>
                <p className="text-sm text-base-content/70">
                  Discover notable accomplishments from your work
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="font-bold mb-2">Skills & Badges</h3>
                <p className="text-sm text-base-content/70">
                  Verify your technical expertise and consistency
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg gap-2"
          onClick={onStartAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Starting Analysis...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Start Your First Analysis
            </>
          )}
        </button>

        <p className="text-sm text-base-content/60 mt-4">
          This will analyze your GitHub activity and generate your professional
          profile
        </p>
      </div>
    </div>
  </div>
);
