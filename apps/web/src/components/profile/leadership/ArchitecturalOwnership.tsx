import React from 'react';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { EngineeringLeadershipScore } from '@verified-prof/shared';

const ArchitecturalOwnership = ({
  leadership,
}: {
  leadership: EngineeringLeadershipScore;
}) => {
  const funnelOption: EChartsOption = {
    title: {
      text: 'Architectural Ownership',
      left: 'center',
      subtext:
        'Full-stack system layers (grayed = not involved, colored = active contribution)',
      textStyle: {
        color: 'rgb(196, 181, 253)',
        fontSize: 18,
        fontWeight: 'bold',
      },
      subtextStyle: {
        fontSize: 14,
      },
    },

    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} files ({d}%)',
      backgroundColor: 'oklch(var(--b2))',
      borderColor: 'oklch(var(--bc) / 0.2)',
      textStyle: {
        color: 'oklch(var(--bc))',
      },
    },
    series: [
      {
        type: 'funnel',
        left: 'center',
        top: 100,
        bottom: 40,
        width: '60%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'none',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          fontSize: 14,
          color: '#fff',
          fontWeight: 'bold',
          formatter: '{d}% stable',
        },
        labelLine: {
          show: true,
          length: 30,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        labelLayout: {
          hideOverlap: false,
        },
        itemStyle: {
          borderColor: '#000',
          borderWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: leadership.architecturalLayers.map((layer, index) => {
          const colors = [
            '#3b82f6', // blue
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#f97316', // orange
            '#14b8a6', // teal
            '#eab308', // yellow
            '#22c55e', // green
            '#6366f1', // indigo
            '#f43f5e', // rose
            '#06b6d4', // cyan
          ];
          const layerColors = [
            '#1e3a8a', // dark blue
            '#5b21b6', // dark purple
            '#9d174d', // dark pink
            '#c2410c', // dark orange
            '#0f766e', // dark teal
            '#a16207', // dark yellow
            '#15803d', // dark green
            '#4338ca', // dark indigo
            '#be123c', // dark rose
            '#0891b2', // dark cyan
          ];
          const color =
            layer.involvement === 0
              ? 'rgba(200, 200, 200, 0.3)'
              : colors[index % colors.length];
          const borderColor =
            layer.involvement === 0
              ? '#999'
              : layerColors[index % layerColors.length];
          return {
            value: layer.fileCount,
            name: layer.layer,
            stabilityRate: layer.stabilityRate,
            label: {
              position: index % 2 === 0 ? 'left' : 'right',
              formatter: `{b}\n${layer.stabilityRate}% stable`,
              color,
              fontSize: 13,
              padding: 20,
            },
            itemStyle: {
              color,
              borderColor,
            },
          };
        }),
      },
    ],
  };
  return <ReactECharts option={funnelOption} style={{ height: 500 }} />;
};

export default ArchitecturalOwnership;
