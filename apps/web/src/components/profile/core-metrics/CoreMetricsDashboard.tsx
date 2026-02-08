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
import { CoreMetricsApiResponse } from '@verified-prof/shared';
import { ComplexityMetric } from './ComplexityMetric';
import { CoreMetricsRadar } from './CoreMetricsRadar';
import { MetricStat } from './MetricStat';
import { SpecializationBadge } from './SpecializationBadge';

interface CoreMetricsDashboardProps {
  coreMetrics: CoreMetricsApiResponse;
  dominantLanguages: string[];
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

export const CoreMetricsDashboard = ({
  coreMetrics,
  dominantLanguages,
}: CoreMetricsDashboardProps) => {
  return (
    <>
      <section className="flex flex-col lg:flex-row gap-2 mt-18">
        <SpecializationBadge
          specialization={coreMetrics.specialization}
          velocityPercentile={100 - coreMetrics.velocityPercentile}
          className="w-full lg:w-1/2"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-1/2">
          <MetricStat
            label="Code Impact"
            value={coreMetrics.codeImpact}
            description="Functions & classes owned"
            trend={coreMetrics.trend}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            tooltip="This metric reflects your architectural footprint in the codebase. It's not just about lines of code, but about the number of logical units (functions/classes) you own or maintain, which is a better indicator of your actual influence and responsibility in the system."
          />
          <MetricStat
            label="Cycle Time"
            value={`${coreMetrics.cycleTime.toFixed(0)}h`}
            description="First to last commit"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            tooltip="Measures the elapsed time between your first and last commit in the analysis window. Lower cycle times indicate focused, efficient work sessions, while higher values may suggest longer-running features or distributed work patterns."
          />
        </div>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <section className="stat bg-base-200 glass">
          <h3 className="text-lg font-semibold mb-4">Dominant Languages</h3>
          <div className="flex flex-wrap gap-2">
            {dominantLanguages.map((lang) => (
              <div key={lang} className="badge badge-xl gap-2">
                {getLanguageIcon(lang)}
                {lang}
              </div>
            ))}
          </div>
        </section>
        <section className="stat bg-base-200 glass">
          <h3 className="text-lg font-semibold mb-4">Total Languages</h3>
          <div className="stat-value text-5xl text-primary">
            {dominantLanguages.length}
          </div>
          <div className="text-sm text-base-content/70 mt-2">
            Languages in your stack
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        <CoreMetricsRadar
          data={{
            velocityPercentile: coreMetrics.velocityPercentile,
            logicDensity: coreMetrics.logicDensity,
            systemComplexityScore: coreMetrics.systemComplexityScore,
            codeImpact: coreMetrics.codeImpact,
            cycleTime: coreMetrics.cycleTime,
          }}
        />
        <ComplexityMetric value={coreMetrics.systemComplexityScore} />
      </section>
    </>
  );
};
