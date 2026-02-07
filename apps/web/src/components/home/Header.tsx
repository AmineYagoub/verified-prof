'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-base-100/80 border-b border-base-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
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

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-base-content/70 hover:text-base-content transition-colors"
          >
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
