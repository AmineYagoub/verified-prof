'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const MAX_RETRIES = 20;
    const RETRY_DELAY = 500;
    let attempts = 0;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setStatus('ready');
            setTimeout(() => {
              router.push('/dashboard');
            }, 500);
            return;
          }
        }

        attempts++;
        if (attempts < MAX_RETRIES) {
          setTimeout(checkSession, RETRY_DELAY);
        } else {
          setStatus('error');
        }
      } catch {
        attempts++;
        if (attempts < MAX_RETRIES) {
          setTimeout(checkSession, RETRY_DELAY);
        } else {
          setStatus('error');
        }
      }
    };

    checkSession();
  }, [router]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-base-content">
            Session Setup Failed
          </h2>
          <p className="mt-2 text-base-content/70">
            We couldn&apos;t set up your session. Please try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary rounded-full"
            >
              Try Again
            </button>
            <a href="/" className="btn btn-outline rounded-full">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 animate-pulse text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <div className="mx-auto mb-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <h2 className="text-2xl font-bold text-base-content">
          Setting up your session...
        </h2>
        <p className="mt-2 text-base-content/70">
          Please wait while we prepare your dashboard.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '0ms' }}
          ></span>
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '150ms' }}
          ></span>
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: '300ms' }}
          ></span>
        </div>
      </div>
    </div>
  );
}
