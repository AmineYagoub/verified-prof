import { DashboardLayout } from '@verified-prof/web/components/dashboard/DashboardLayout';
import { CoreMetricsDashboard } from '@verified-prof/web/components/profile/core-metrics/CoreMetricsDashboard';
import { TechStackDNATimeline } from '@verified-prof/web/components/profile/tech-stack/TechStackDNATimeline';
import { ProfileHero } from '@verified-prof/web/components/profile/user-info/ProfileInfo';
import { getSession } from '@verified-prof/web/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <ProfileHero
        userName={session.user.name}
        userImage={session.user.image}
      />
      <CoreMetricsDashboard userId={session.user.id} />
      <TechStackDNATimeline userId={session.user.id} />
    </DashboardLayout>
  );
}
