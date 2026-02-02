'use client';

import { ReactNode } from 'react';

interface MetricStatProps {
  label: string;
  value: number | string;
  description?: string;
  trend?: 'IMPROVING' | 'STABLE' | 'DECLINING' | null;
  icon?: ReactNode;
  tooltip?: string;
}

export const MetricStat = ({
  label,
  value,
  description,
  trend,
  icon,
  tooltip,
}: MetricStatProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'IMPROVING':
        return (
          <svg
            className="w-5 h-5 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'DECLINING':
        return (
          <svg
            className="w-5 h-5 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        );
      case 'STABLE':
        return (
          <svg
            className="w-5 h-5 text-info"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14"
            />
          </svg>
        );
    }
  };

  return (
    <div className="stat bg-base-200 glass">
      <div className="stat-title text-base font-semibold flex items-center gap-1">
        {icon}
        {label}
        {tooltip && (
          <div className="tooltip tooltip-info tooltip-left text-xs text-base-content/70">
            <div className="tooltip-content text-xs text-left p-2 leading-normal">
              {tooltip}
            </div>
            <svg
              className="w-4 h-4 text-base-content/50 cursor-help"
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
          </div>
        )}
      </div>
      <div className="stat-value text-5xl flex items-center gap-2">
        <span>{value}</span>
        {getTrendIcon()}
      </div>
      {description && <div className="stat-desc text-xs">{description}</div>}
    </div>
  );
};
