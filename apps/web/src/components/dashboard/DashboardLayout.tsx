'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />

      <main className="drawer-content flex flex-col gap-2 overflow-auto max-w-5xl mx-auto w-full my-12 px-4">
        {children}
      </main>

      <aside className="drawer-side bg-base-200 min-h-screen w-64 flex flex-col">
        <div className="p-4 border-b border-base-300">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/v-logo.png"
              alt="Verified.Prof Logo"
              width={32}
              height={22}
              className="h-8 w-auto"
              priority
            />
            <span className="font-bold text-lg">erified.Prof</span>
          </Link>
        </div>

        <ul className="menu flex-1 p-4 gap-2 w-full mt-4">
          <li
            className={`flex items-start gap-3 rounded-full ${
              isActive('/dashboard') ? 'menu-active' : ''
            }`}
          >
            <Link href="/dashboard">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>My Profile</span>
            </Link>
          </li>

          <li
            className={`flex items-start gap-3 rounded-full ${
              isActive('/dashboard/analysis') ? 'menu-active' : ''
            }`}
          >
            <Link href="/dashboard/analysis">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Analysis</span>
            </Link>
          </li>

          <li
            className={`flex items-start gap-3 rounded-full ${
              isActive('/dashboard/vtwin') ? 'menu-active' : ''
            }`}
          >
            <Link href="/dashboard/vtwin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11a5 5 0 0110 0"
                />
                <circle
                  cx="12"
                  cy="2"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="8"
                  cy="3"
                  r="0.5"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="16"
                  cy="3"
                  r="0.5"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              <span>vTwin</span>
            </Link>
          </li>
        </ul>

        <div className="p-4 border-t border-base-300 space-y-2">
          <Link
            href="/settings"
            className="btn btn-ghost btn-sm w-full justify-start gap-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </Link>
          <Link
            href="/api/auth/signout"
            className="btn btn-ghost btn-sm w-full justify-start gap-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </div>
  );
};
