import DashboardPage from '@verified-prof/web/components/dashboard/DashboardPage';
import { getSession } from '@verified-prof/web/lib/auth-server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Verified Prof | Dashboard',
};

export default async function Dashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return <DashboardPage userId={session.user.id} />;
}
