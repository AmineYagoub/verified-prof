import ReactQueryClientProvider from '@verified-prof/web/providers/ReactQueryClientProvider';
import ProfilePage from '@verified-prof/web/components/profile/ProfilePage';
import { dehydrate } from '@tanstack/react-query';
import getQueryClient from '@verified-prof/web/lib/react-query/query-client.server';
import { ProfileService } from '@verified-prof/web/services/profile.service';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} | Verified.Prof`,
    description: `View ${slug}'s engineering profile, code analysis, and technical expertise.`,
  };
}

export default async function Profile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = getQueryClient();
  await queryClient.fetchQuery({
    queryKey: ['userProfile', slug],
    queryFn: () => ProfileService.getCurrentProfile(slug),
  });
  const dehydratedState = dehydrate(queryClient);
  return (
    <ReactQueryClientProvider dehydratedState={dehydratedState}>
      <ProfilePage slug={slug} />
    </ReactQueryClientProvider>
  );
}
