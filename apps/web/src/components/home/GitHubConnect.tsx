'use client';

import { signInWithGitHub } from '@verified-prof/web/lib/auth-client';
import { ConnectIcon } from '../icons/ConnectIcon';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GitHubConnectProps {
  text?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GitHubConnect = ({
  text = 'Connect GitHub',
}: GitHubConnectProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await signInWithGitHub();
      await sleep(1500);
      if (res.data.redirect) {
        router.push('/redirect');
      }
    } catch (error) {
      return error;
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="btn btn-primary btn-sm min-w-[150px]"
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <>
          <ConnectIcon />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
