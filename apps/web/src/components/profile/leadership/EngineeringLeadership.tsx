'use client';

import { useEngineeringLeadership } from '@verified-prof/web/hooks';
import ArchitecturalOwnership from './ArchitecturalOwnership';
import EffortDistribution from './EffortDistribution';

interface EngineeringLeadershipProps {
  userId: string;
}

export const EngineeringLeadership = ({
  userId,
}: EngineeringLeadershipProps) => {
  const {
    data: leadership,
    isLoading,
    error,
  } = useEngineeringLeadership(userId);

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
        <span>Failed to load engineering leadership data.</span>
      </section>
    );
  }

  if (!leadership || leadership.architecturalLayers.length === 0) {
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
          No leadership data yet. Run analysis to generate your profile.
        </span>
      </section>
    );
  }

  return (
    <>
      <ArchitecturalOwnership leadership={leadership} />
      <EffortDistribution leadership={leadership} />
    </>
  );
};
