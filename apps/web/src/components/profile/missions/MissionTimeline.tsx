'use client';

import { useMissions } from '@verified-prof/web/hooks';

interface MissionTimelineProps {
  userId: string;
}

const getImpactBadgeClass = (impact: string) => {
  switch (impact) {
    case 'Feature':
      return 'badge-primary';
    case 'Fix':
      return 'badge-error';
    case 'Refactor':
      return 'badge-warning';
    case 'Infrastructure':
      return 'badge-info';
    default:
      return 'badge-ghost';
  }
};

const getDomainBadgeClass = (domain: string) => {
  switch (domain) {
    case 'Backend':
      return 'badge-secondary';
    case 'Frontend':
      return 'badge-accent';
    case 'DevOps':
      return 'badge-info';
    case 'Testing':
      return 'badge-warning';
    default:
      return 'badge-ghost';
  }
};

export const MissionTimeline = ({ userId }: MissionTimelineProps) => {
  const { data: missions, isLoading, error } = useMissions(userId);

  if (isLoading) {
    return (
      <section className="flex items-center justify-center p-12">
        <div className="loading loading-spinner loading-lg"></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="alert alert-error">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Failed to load mission timeline.</span>
      </section>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <section className="alert alert-info">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          No missions yet. Run your first analysis to generate missions.
        </span>
      </section>
    );
  }

  return (
    <section className="mt-2">
      <h2 className="card-title text-2xl">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        Mission Timeline
      </h2>

      <ul className="timeline timeline-vertical timeline-snap-icon">
        {missions.map((mission, idx) => (
          <li key={mission.id}>
            {idx > 0 && <hr />}
            <div className="timeline-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 ${
                  mission.isHeroMission
                    ? 'text-primary'
                    : 'text-base-content/50'
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div
              className={`timeline-${idx % 2 === 0 ? 'start' : 'end'} mb-10 ${idx % 2 === 0 ? 'md:text-end' : ''}`}
            >
              <time className="font-mono italic text-sm text-base-content/60">
                {new Date(mission.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
              <div
                className={`card ${mission.isHeroMission ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200'} mt-2`}
              >
                <div className="card-body p-4 text-left">
                  <h3 className="card-title text-base mb-2">{mission.title}</h3>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`badge badge-sm ${getImpactBadgeClass(mission.impact)}`}
                    >
                      {mission.impact}
                    </span>
                    <span
                      className={`badge badge-sm ${getDomainBadgeClass(mission.domainContext)}`}
                    >
                      {mission.domainContext}
                    </span>
                    {mission.isHeroMission && (
                      <span className="badge badge-sm badge-primary">
                        ⭐ Hero
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-base-content/80 mb-3">
                    {mission.summary}
                  </p>

                  {mission.achievements.length > 0 && (
                    <ul className="space-y-1">
                      {mission.achievements.map((achievement, achIdx) => (
                        <li
                          key={achIdx}
                          className="text-xs text-base-content/70 flex items-start gap-2"
                        >
                          <svg
                            className="w-4 h-4 text-success mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {mission.architecturalFeat && (
                    <div className="alert alert-success text-xs p-2 mt-3">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{mission.architecturalFeat}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {idx < missions.length - 1 && <hr />}
          </li>
        ))}
      </ul>
    </section>
  );
};
