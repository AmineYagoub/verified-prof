'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ComplexityMetricProps {
  value: number;
}

export const ComplexityMetric = ({ value }: ComplexityMetricProps) => {
  const color =
    value >= 75
      ? 'rgb(196, 181, 253)'
      : value >= 50
        ? 'rgb(158, 136, 247)'
        : 'rgb(142, 115, 248)';

  const getComplexityLabel = () => {
    if (value < 20) return 'Clean, simple code (easier to maintain)';
    if (value < 40) return 'Moderate complexity (acceptable)';
    if (value < 60) return 'High complexity (harder to maintain)';
    return 'Very high complexity (technical debt risk)';
  };

  const option: EChartsOption = {
    title: {
      text: 'Logic Complexity Score',
      left: 'center',
      textStyle: {
        color: 'rgb(196, 181, 253)',
        fontSize: 18,
        fontWeight: 'bold',
      },
    },
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        center: ['50%', '62%'],
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false,
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color,
          },
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, '#161212']],
          },
        },
        splitLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        data: [
          {
            value: Number(value.toFixed(1)),
            detail: {
              valueAnimation: true,
              offsetCenter: ['0%', '0%'],
            },
          },
        ],
        detail: {
          fontSize: 32,
          fontWeight: 'bold',
          color: color,
          formatter: '{value}%',
          offsetCenter: ['0%', '0%'],
        },
      },
    ],
  };

  return (
    <div className="flex flex-col h-full ">
      <ReactECharts
        option={option}
        style={{ height: '300px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />

      <p className="text-sm mt-4  text-center font-semibold text-base-content/90">
        {getComplexityLabel()}
      </p>
    </div>
  );
};
