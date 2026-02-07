'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SiX, SiReddit, SiDiscord } from '@icons-pack/react-simple-icons';

export const FooterCTA = () => {
  return (
    <footer className="relative overflow-hidden bg-black">
      {/* Large outlined text */}
      <h2
        className="text-[20vw] md:text-[18vw] leading-none font-bold tracking-tighter text-center"
        style={{
          WebkitTextStroke: '1px rgba(255,255,255,0.3)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          fontVariant: 'all-petite-caps',
        }}
      >
        Verified.Prof
      </h2>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="border-t border-white/10 py-8">
          <div className="flex items-center justify-between gap-6">
            <nav className="flex items-center gap-6 w-[300px]">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/v-logo.png"
                  alt="Verified.Prof Logo"
                  width={32}
                  height={22}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Contact us
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
            </nav>

            <p className="text-sm text-gray-400 ">
              &copy; {new Date().getFullYear()} Verified.Prof All rights
              reserved.
            </p>

            <div className="flex items-center gap-4 w-[300px] justify-end">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <SiX className="w-5 h-5" />
              </a>
              <a
                href="https://reddit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Reddit"
              >
                <SiReddit className="w-5 h-5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Discord"
              >
                <SiDiscord className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
