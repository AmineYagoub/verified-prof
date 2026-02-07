'use client';

import { signInWithGitHub } from '@verified-prof/web/lib/auth-client';
import { ConnectIcon } from '../icons/ConnectIcon';

interface GitHubConnectProps {
  text?: string;
}

export const GitHubConnect = ({
  text = 'Connect GitHub',
}: GitHubConnectProps) => {
  const handleConnect = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      return error;
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="btn btn-primary btn-sm min-w-[150px]"
    >
      <ConnectIcon />
      <span>{text}</span>
    </button>
  );
};
