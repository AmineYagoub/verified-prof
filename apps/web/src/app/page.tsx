import Link from 'next/link';
import { getSession } from '@verified-prof/web/lib/auth-server';
import { Navigation } from '@verified-prof/web/components/Navigation';
import { HeroSection } from '@verified-prof/web/components/HeroSection';
import { ConnectionCards } from '@verified-prof/web/components/ConnectionCard';
import { TrustIndicators } from '@verified-prof/web/components/TrustIndicators';

export default async function Home() {
  const session = await getSession();

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome back!</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-grid-fade" />

      <Navigation />

      <section className="relative z-10 hero min-h-[calc(100vh-5rem)]">
        <div className="hero-content text-center max-w-8xl">
          <div className="space-y-8">
            <HeroSection />
            <ConnectionCards />

            <p className="text-base-content/50">
              It takes 10 seconds, forever to relax.
            </p>

            <TrustIndicators />
          </div>
        </div>
      </section>
    </main>
  );
}
