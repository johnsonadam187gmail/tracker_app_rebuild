'use client';

import { useMemo } from 'react';
import { useTheme } from './useTheme';

export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = useMemo(() => ({
    primary: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)',
    primaryBorder: isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.2)',
    background: isDark ? '#1e293b' : '#ffffff',
    positive: isDark ? '#4ade80' : '#22c55e',
    negative: isDark ? '#f87171' : '#ef4444',
    warning: isDark ? '#fbbf24' : '#f59e0b',
  }), [isDark]);

  const chartBaseOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: colors.text,
        },
      },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
    },
  }), [colors, isDark]);

  return { colors, chartBaseOptions, isDark };
}
