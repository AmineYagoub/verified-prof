'use client';

import { useCoreMetrics } from '../../../hooks/use-core-metrics';
import { ComplexityMetric } from './ComplexityMetric';
import { CoreMetricsRadar } from './CoreMetricsRadar';
import { MetricStat } from './MetricStat';
import { SpecializationBadge } from './SpecializationBadge';

interface CoreMetricsDashboardProps {
  userId: string;
}

export const CoreMetricsDashboard = ({ userId }: CoreMetricsDashboardProps) => {
  const { data: metrics, isLoading, error } = useCoreMetrics(userId);

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
          Failed to load core metrics. Please try running an analysis first.
        </span>
      </div>
    );
  }

  if (!metrics) {
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
          Core metrics not yet available. Run your first analysis to generate
          metrics.
        </span>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col lg:flex-row gap-2">
        <SpecializationBadge
          specialization={metrics.specialization}
          velocityPercentile={100 - metrics.velocityPercentile}
          className="w-full lg:w-1/2"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-1/2">
          <MetricStat
            label="Code Impact"
            value={metrics.codeImpact}
            description="Functions & classes owned"
            trend={metrics.trend}
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
            value={`${metrics.cycleTime.toFixed(1)}h`}
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CoreMetricsRadar
          data={{
            velocityPercentile: metrics.velocityPercentile,
            logicDensity: metrics.logicDensity,
            systemComplexityScore: metrics.systemComplexityScore,
            codeImpact: metrics.codeImpact,
            cycleTime: metrics.cycleTime,
          }}
        />

        <ComplexityMetric value={metrics.systemComplexityScore} />
      </section>
    </>
  );
};
