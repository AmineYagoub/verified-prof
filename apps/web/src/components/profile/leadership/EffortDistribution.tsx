import React, { useMemo, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  startOfYear,
  endOfYear,
  eachYearOfInterval,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { EngineeringLeadershipScore } from '@verified-prof/shared';

type AggregationType = 'weekly' | 'monthly' | 'yearly';

const EffortDistribution = ({
  leadership,
}: {
  leadership: EngineeringLeadershipScore;
}) => {
  const [aggregation, setAggregation] = useState<AggregationType>('monthly');

  const hasEffortData =
    leadership.effortDistribution && leadership.effortDistribution.length > 0;

  const aggregatedData = useMemo(() => {
    if (!hasEffortData) return null;

    const dataMap = new Map<
      string,
      {
        features: number;
        fixes: number;
        refactors: number;
        tests: number;
        documentation: number;
        infrastructure: number;
        performance: number;
        security: number;
      }
    >();

    leadership.effortDistribution.forEach((week) => {
      const date = new Date(week.weekStart);
      let key: string;

      if (aggregation === 'yearly') {
        key = format(startOfYear(date), 'yyyy');
      } else if (aggregation === 'monthly') {
        key = format(startOfMonth(date), 'yyyy-MM');
      } else {
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, {
          features: 0,
          fixes: 0,
          refactors: 0,
          tests: 0,
          documentation: 0,
          infrastructure: 0,
          performance: 0,
          security: 0,
        });
      }

      const period = dataMap.get(key);
      if (period) {
        period.features += week.categories.features;
        period.fixes += week.categories.fixes;
        period.refactors += week.categories.refactors;
        period.tests += week.categories.tests;
        period.documentation += week.categories.documentation;
        period.infrastructure += week.categories.infrastructure;
        period.performance += week.categories.performance;
        period.security += week.categories.security;
      }
    });

    const currentDate = new Date();
    let periods: Date[];
    let formatString: string;

    if (aggregation === 'yearly') {
      const startDate = subYears(currentDate, 14);
      periods = eachYearOfInterval({
        start: startOfYear(startDate),
        end: endOfYear(currentDate),
      });
      formatString = 'yyyy';
    } else if (aggregation === 'monthly') {
      const startDate = subMonths(currentDate, 14);
      periods = eachMonthOfInterval({
        start: startOfMonth(startDate),
        end: endOfMonth(currentDate),
      });
      formatString = 'MMM yyyy';
    } else {
      const startDate = subWeeks(currentDate, 14);
      periods = eachWeekOfInterval(
        {
          start: startOfWeek(startDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        },
        { weekStartsOn: 1 },
      );
      formatString = 'MMM dd';
    }

    return periods.map((date) => {
      let key: string;
      if (aggregation === 'yearly') {
        key = format(date, 'yyyy');
      } else if (aggregation === 'monthly') {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }

      const data = dataMap.get(key) || {
        features: 0,
        fixes: 0,
        refactors: 0,
        tests: 0,
        documentation: 0,
        infrastructure: 0,
        performance: 0,
        security: 0,
      };

      return {
        label: format(date, formatString),
        ...data,
      };
    });
  }, [hasEffortData, leadership.effortDistribution, aggregation]);

  const stackedAreaOption: EChartsOption = aggregatedData
    ? {
        title: {
          text: 'Engineering Effort Distribution',
          left: 'center',
          subtext:
            'Where time flows: features, fixes, refactors, tests, infrastructure, and more',
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
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985',
            },
          },
        },
        legend: {
          bottom: 0,
          data: [
            'Features',
            'Fixes',
            'Refactors',
            'Tests',
            'Docs',
            'Infra',
            'Perf',
            'Security',
          ],
          textStyle: {
            color: 'oklch(var(--bc))',
          },
        },
        grid: {
          top: '20%',
          bottom: '20%',
          containLabel: false,
          left: 0,
          right: 0,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: aggregatedData.map((d) => d.label),
          axisLabel: {
            color: 'rgb(196, 181, 253)',
            rotate: aggregation === 'weekly' ? 45 : 0,
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: 'rgb(196, 181, 253)',
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(196, 181, 253, 0.3)',
            },
          },
        },
        series: [
          {
            name: 'Features',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(128, 255, 165)',
                },
                {
                  offset: 1,
                  color: 'rgb(1, 191, 236)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.features),
          },
          {
            name: 'Fixes',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 0, 135)',
                },
                {
                  offset: 1,
                  color: 'rgb(135, 0, 157)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.fixes),
          },
          {
            name: 'Refactors',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(0, 221, 255)',
                },
                {
                  offset: 1,
                  color: 'rgb(77, 119, 255)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.refactors),
          },
          {
            name: 'Tests',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(55, 162, 255)',
                },
                {
                  offset: 1,
                  color: 'rgb(116, 21, 219)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.tests),
          },
          {
            name: 'Docs',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 191, 0)',
                },
                {
                  offset: 1,
                  color: 'rgb(224, 62, 76)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.documentation),
          },
          {
            name: 'Infra',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(180, 180, 180)',
                },
                {
                  offset: 1,
                  color: 'rgb(100, 100, 120)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.infrastructure),
          },
          {
            name: 'Perf',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 100, 200)',
                },
                {
                  offset: 1,
                  color: 'rgb(200, 50, 255)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.performance),
          },
          {
            name: 'Security',
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: {
              width: 0,
            },
            showSymbol: false,
            areaStyle: {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgb(255, 120, 0)',
                },
                {
                  offset: 1,
                  color: 'rgb(200, 80, 50)',
                },
              ]),
            },
            emphasis: { focus: 'series' },
            data: aggregatedData.map((d) => d.security),
          },
        ],
      }
    : {};

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          className="select select-bordered select-sm max-w-[150px]"
          value={aggregation}
          onChange={(e) => setAggregation(e.target.value as AggregationType)}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly </option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <ReactECharts
        option={stackedAreaOption}
        style={{ height: 450, width: '100%' }}
      />
    </div>
  );
};

export default EffortDistribution;
