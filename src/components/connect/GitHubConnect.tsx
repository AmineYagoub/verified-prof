'use client';

import { signInWithGitHub } from '@/lib/auth-client';
import { ConnectIcon } from '../icons/ConnectIcon';

interface GitHubConnectButtonProps {
  className?: string;
  text?: string;
}

export const GitHubConnectButton = ({
  className = '',
  text = 'Connect GitHub',
}: GitHubConnectButtonProps) => {
  const handleConnect = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error('Failed to connect GitHub:', error);
    }
  };

  return (
    <button
      onClick={handleConnect}
      className={`
        shimmer btn btn-primary flex items-center gap-2 btn-outline border-3 border-base-300 w-28 justify-center py-1
         hover:border-base-100 text-base-100
        ${className}
      `}
    >
      <ConnectIcon />
      <span>{text}</span>
    </button>
  );
};
