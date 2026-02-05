import VoiceTwinPage from '@verified-prof/web/components/twin/TwinPage';

export default async function VoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <VoiceTwinPage slug={slug} />;
}
