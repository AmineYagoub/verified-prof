'use client';

import { useVoiceTwin } from '@verified-prof/web/hooks/use-voice-twin';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingCanvas from '@verified-prof/web/components/twin/LoadingCanvas';
import ThreeScene from '@verified-prof/web/components/twin/ThreeScene';
import SpectrumAnalyzer from '@verified-prof/web/components/twin/SpectrumAnalyzer';
import CircularVisualizer from '@verified-prof/web/components/twin/CircularVisualizer';

const VoiceTwinPage = ({ slug }: { slug: string }) => {
  const { isPreparing, audioAnalyser, startSession, endSession } =
    useVoiceTwin(slug);
  const router = useRouter();

  useEffect(() => {
    startSession();
  }, [startSession]);

  const handleEndSession = async () => {
    await endSession();
    router.push(`/profile/${slug}`);
  };

  return (
    <div className="fixed inset-0 bg-[#12100f] overflow-hidden">
      {isPreparing ? (
        <LoadingCanvas />
      ) : (
        <>
          <ThreeScene audioAnalyser={audioAnalyser} />
          <CircularVisualizer audioAnalyser={audioAnalyser} />
          <SpectrumAnalyzer audioAnalyser={audioAnalyser} />
          <button
            onClick={handleEndSession}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-[rgba(59,130,246,0.2)] hover:bg-[rgba(59,130,246,0.4)] border border-[#3b82f6] text-[#3b82f6] rounded-md backdrop-blur-md transition-colors uppercase tracking-wide text-sm font-semibold"
          >
            End Interview
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceTwinPage;
