'use client';
import { Header } from './Header';
import { ConnectionCards } from './ConnectionCard';
import { HeroSection } from './HeroSection';
import { FAQ } from './FAQ';
import { FooterCTA } from './FooterCTA';
import CtaSection from './CtaSection';

const HomePage = () => {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="min-h-screen relative overflow-hidden max-w-5xl mx-auto">
        <HeroSection />
        <ConnectionCards />
        <FAQ />
        <CtaSection />
      </main>
      <FooterCTA />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
    </div>
  );
};

export default HomePage;
