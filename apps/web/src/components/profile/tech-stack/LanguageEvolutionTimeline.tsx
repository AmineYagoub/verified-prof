import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useLanguageEvolution, useStackDna } from '@verified-prof/web/hooks';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
};

const getLanguageGradient = (index: number) => {
  const gradients = [
    [
      { offset: 0, color: 'rgb(59, 130, 246)' },
      { offset: 1, color: 'rgb(29, 78, 216)' },
    ],
    [
      { offset: 0, color: 'rgb(16, 185, 129)' },
      { offset: 1, color: 'rgb(5, 150, 105)' },
    ],
    [
      { offset: 0, color: 'rgb(245, 158, 11)' },
      { offset: 1, color: 'rgb(217, 119, 6)' },
    ],
    [
      { offset: 0, color: 'rgb(239, 68, 68)' },
      { offset: 1, color: 'rgb(220, 38, 38)' },
    ],
    [
      { offset: 0, color: 'rgb(139, 92, 246)' },
      { offset: 1, color: 'rgb(109, 40, 217)' },
    ],
    [
      { offset: 0, color: 'rgb(236, 72, 153)' },
      { offset: 1, color: 'rgb(219, 39, 119)' },
    ],
    [
      { offset: 0, color: 'rgb(6, 182, 212)' },
      { offset: 1, color: 'rgb(8, 145, 178)' },
    ],
    [
      { offset: 0, color: 'rgb(132, 204, 22)' },
      { offset: 1, color: 'rgb(101, 163, 13)' },
    ],
  ];
  return gradients[index % gradients.length];
};

export const LanguageEvolutionTimeline = () => {
  const { data, isLoading, isError } = useLanguageEvolution();
  const { data: stackDna } = useStackDna();

  const chartOption = useMemo(() => {
    if (!data || data.languages.length === 0) return null;

    const currentYear = new Date().getFullYear();
    const { startYear } = data.timeline;

    const years = Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i,
    );

    const languageYearlyDataMap = new Map<string, Map<number, number>>();
    data.languages.forEach((lang) => {
      const yearMap = new Map<number, number>();
      lang.yearlyVolume.forEach((yv) => {
        yearMap.set(yv.year, yv.bytes);
      });
      languageYearlyDataMap.set(lang.name, yearMap);
    });
    const languageColorMap = new Map<string, number>();
    data.languages.forEach((lang, index) => {
      languageColorMap.set(lang.name, index);
    });
    const sortedLanguages = [...data.languages].sort(
      (a, b) => a.totalBytes - b.totalBytes,
    );

    const series = sortedLanguages.map((lang) => {
      const yearMap = languageYearlyDataMap.get(lang.name);
      const yearlyData = years.map((year) => yearMap?.get(year) || 0);
      const colorIndex = languageColorMap.get(lang.name) || 0;
      const gradient = getLanguageGradient(colorIndex);

      return {
        name: lang.name,
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradient),
        },
        emphasis: {
          focus: 'series',
        },
        data: yearlyData,
      };
    });

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'ENGINEERING EVOLUTION',
        subtext: `${data.learningPivots.length} learning pivots detected • Showing ${
          new Date().getFullYear() - data.timeline.startYear + 1
        } years of evolution`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: '#a2a9b7',
          fontSize: 14,
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: 0,
        right: '2%',
        bottom: '5%',
        top: '20%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: years,
          axisLabel: {
            color: '#f3f5fa',
            fontSize: 12,
          },
          axisLine: {
            lineStyle: {
              color: '#374151',
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          min: 0,
          axisLabel: {
            color: '#6b7280',
            formatter: (value: number) => {
              if (value === 0) return '0';
              return formatBytes(value);
            },
          },
          axisLine: {
            lineStyle: {
              color: '#374151',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#1f2937',
            },
          },
        },
      ],
      series,
    };
  }, [data]);

  if (isLoading) {
    return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="h-6 w-64 bg-base-300 rounded animate-pulse mb-4" />
          <div className="h-96 bg-base-300 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Language Evolution Timeline</h2>
          <div className="alert alert-error">
            <span>Failed to load language evolution data</span>
          </div>
        </div>
      </section>
    );
  }

  if (data.languages.length === 0) {
    return (
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Language Evolution Timeline</h2>
          <div className="alert alert-info">
            <span>No language evolution data available</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="language-evolution-timeline">
      <h2 id="language-evolution-timeline" className="sr-only">
        Language Evolution Timeline
      </h2>
      <figure>
        <ReactECharts
          option={chartOption}
          style={{ height: '450px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </figure>
      <nav aria-label="Dominant languages">
        <ul className="flex flex-wrap gap-3 justify-center list-none p-0 m-0">
          {stackDna?.dominantLanguages?.map((langName) => {
            const milestone = stackDna.milestones.find(
              (m) => m.language === langName,
            );
            const langIndex = data.languages.findIndex(
              (l) => l.name === langName,
            );
            const gradient =
              langIndex >= 0 ? getLanguageGradient(langIndex) : null;

            return (
              <li
                key={langName}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200"
              >
                {gradient && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${gradient[0].color}, ${gradient[1].color})`,
                    }}
                    aria-hidden="true"
                  />
                )}
                <span className="font-medium text-sm">{langName}</span>
                {milestone && (
                  <>
                    <span className="text-xs text-base-content/60">
                      {milestone.intensity.toFixed(1)}%
                    </span>
                    <span
                      className="text-xs text-base-content/60"
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <span className="text-xs text-base-content/60">
                      {milestone.yearsActive}y active
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
};
