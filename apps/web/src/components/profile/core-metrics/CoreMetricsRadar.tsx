'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CoreMetricsRadarProps {
  data: {
    velocityPercentile: number;
    logicDensity: number;
    systemComplexityScore: number;
    codeImpact: number;
    cycleTime: number;
  };
}

export const CoreMetricsRadar = ({ data }: CoreMetricsRadarProps) => {
  const option: EChartsOption = {
    title: {
      text: 'Developer Profile Radar',
      left: 'center',
      textStyle: {
        color: 'rgb(196, 181, 253)',
        fontSize: 18,
        fontWeight: 'bold',
      },
    },
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: 'Velocity', max: 100 },
        { name: 'Logic Density', max: 100 },
        { name: 'Complexity', max: 100 },
        { name: 'Code Impact', max: 100 },
        { name: 'Cycle Time', max: 100 },
      ],
      splitArea: {
        areaStyle: {
          color: [
            'rgba(99, 102, 241, 0.05)',
            'rgba(99, 102, 241, 0.1)',
            'rgba(99, 102, 241, 0.15)',
            'rgba(99, 102, 241, 0.2)',
          ],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(139, 92, 246, 0.6)',
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(139, 92, 246, 0.6)',
        },
      },
      axisName: {
        color: 'rgba(167, 139, 250, 0.95)',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              data.velocityPercentile,
              data.logicDensity * 100,
              data.systemComplexityScore,
              Math.min(data.codeImpact, 100),
              Math.min(data.cycleTime, 100),
            ],
            name: 'Developer Metrics',
            areaStyle: {
              color: 'rgba(139, 92, 246, 0.5)',
            },
            lineStyle: {
              color: 'rgb(167, 139, 250)',
              width: 3,
            },
            itemStyle: {
              color: 'rgb(167, 139, 250)',
              borderColor: 'rgb(196, 181, 253)',
              borderWidth: 2,
            },
          },
        ],
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};
