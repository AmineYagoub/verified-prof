'use client';

import { useProfile } from '@verified-prof/web/hooks/use-profile';
import { ProfileHero } from './user-info/ProfileHero';
import { CoreMetricsDashboard } from './core-metrics/CoreMetricsDashboard';
import { MissionLine } from './missions/MissionLine';
import { EngineeringLeadership } from './leadership/EngineeringLeadership';

const ProfilePage = ({ slug }: { slug: string }) => {
  const { data, isLoading, error } = useProfile(slug);

  if (isLoading) {
    return (
      <main className="drawer-content flex flex-col items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="mt-4 text-base-content/70">Loading profile...</p>
      </main>
    );
  }

  if (error) {
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

  if (!data) {
    return (
      <main className="drawer-content flex flex-col items-center justify-center min-h-screen px-4">
        <div className="alert alert-info max-w-2xl">
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
          <span>
            Profile not found. The profile may have been removed or the link is
            incorrect.
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="drawer-content flex flex-col gap-2 overflow-auto max-w-5xl mx-auto w-full py-8 min-h-screen">
      <ProfileHero userName={data.name} userImage={data.image} bio={data.bio} />
      <CoreMetricsDashboard
        coreMetrics={data.coreMetrics}
        dominantLanguages={data.techStackDNA.dominantLanguages}
      />
      <MissionLine missionTimeline={data.missionTimeline} />
      <EngineeringLeadership userId={data.userId} />
    </main>
  );
};

export default ProfilePage;
