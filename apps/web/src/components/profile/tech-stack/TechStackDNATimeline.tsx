'use client';

import {
  SiTypescript,
  SiJavascript,
  SiPython,
  SiGo,
  SiRust,
  SiCplusplus,
  SiC,
  SiPhp,
  SiRuby,
  SiSwift,
  SiKotlin,
  SiSharp,
  SiReact,
  SiVuedotjs,
  SiSvelte,
  SiScala,
  SiDart,
  SiElixir,
  SiErlang,
  SiHaskell,
  SiClojure,
  SiLua,
  SiR,
  SiPerl,
  SiZig,
} from '@icons-pack/react-simple-icons';
import { useTechStackDNA } from '../../../hooks/use-tech-stack-dna';

interface TechStackDNATimelineProps {
  userId: string;
}

const getLanguageIcon = (lang: string) => {
  const lower = lang.toLowerCase();
  if (lower.includes('react')) return <SiReact className="w-4 h-4" />;
  if (lower.includes('typescript')) return <SiTypescript className="w-4 h-4" />;
  if (lower.includes('javascript')) return <SiJavascript className="w-4 h-4" />;
  if (lower.includes('python')) return <SiPython className="w-4 h-4" />;
  if (lower.includes('go')) return <SiGo className="w-4 h-4" />;
  if (lower.includes('rust')) return <SiRust className="w-4 h-4" />;
  if (lower.includes('c++') || lower.includes('cpp'))
    return <SiCplusplus className="w-4 h-4" />;
  if (lower === 'c') return <SiC className="w-4 h-4" />;
  if (lower.includes('php')) return <SiPhp className="w-4 h-4" />;
  if (lower.includes('ruby')) return <SiRuby className="w-4 h-4" />;
  if (lower.includes('swift')) return <SiSwift className="w-4 h-4" />;
  if (lower.includes('kotlin')) return <SiKotlin className="w-4 h-4" />;
  if (lower.includes('c#') || lower.includes('csharp'))
    return <SiSharp className="w-4 h-4" />;
  if (lower.includes('vue')) return <SiVuedotjs className="w-4 h-4" />;
  if (lower.includes('svelte')) return <SiSvelte className="w-4 h-4" />;
  if (lower.includes('scala')) return <SiScala className="w-4 h-4" />;
  if (lower.includes('dart')) return <SiDart className="w-4 h-4" />;
  if (lower.includes('elixir')) return <SiElixir className="w-4 h-4" />;
  if (lower.includes('erlang')) return <SiErlang className="w-4 h-4" />;
  if (lower.includes('haskell')) return <SiHaskell className="w-4 h-4" />;
  if (lower.includes('clojure')) return <SiClojure className="w-4 h-4" />;
  if (lower.includes('lua')) return <SiLua className="w-4 h-4" />;
  if (lower === 'r') return <SiR className="w-4 h-4" />;
  if (lower.includes('perl')) return <SiPerl className="w-4 h-4" />;
  if (lower.includes('zig')) return <SiZig className="w-4 h-4" />;
  return null;
};

export const TechStackDNATimeline = ({ userId }: TechStackDNATimelineProps) => {
  const { data: techStack, isLoading, error } = useTechStackDNA(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Failed to load Tech Stack DNA. Please try running an analysis first.
        </span>
      </div>
    );
  }

  if (!techStack || techStack.languages.length === 0) {
    return (
      <div className="alert alert-info">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Tech Stack DNA not yet available. Run your first analysis to generate
          language expertise data.
        </span>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      <section className="card bg-base-200 stat glass">
        <h3 className="text-lg font-semibold mb-4">Dominant Languages</h3>
        <div className="flex flex-wrap gap-2">
          {techStack.dominantLanguages.map((lang) => (
            <div key={lang} className="badge badge-xl gap-2">
              {getLanguageIcon(lang)}
              {lang}
            </div>
          ))}
        </div>
      </section>

      <section className="card bg-base-200 stat glass">
        <h3 className="text-lg font-semibold mb-4">Total Languages</h3>
        <div className="stat-value text-5xl text-primary">
          {techStack.languages.length}
        </div>
        <div className="text-sm text-base-content/70 mt-2">
          Languages in your stack
        </div>
      </section>
    </section>
  );
};
