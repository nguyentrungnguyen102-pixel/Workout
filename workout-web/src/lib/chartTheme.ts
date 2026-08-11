import { useThemeStore } from '../stores/themeStore';

// recharts props (stroke/fill/contentStyle) take literal color strings, not
// Tailwind classes, so they can't pick up the CSS-var-driven palette in
// index.css automatically — this hook hands charts the matching literal
// for the currently resolved theme instead.
export interface ChartTheme {
  grid: string;
  tick: string;
  tickStrong: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  barMuted: string;
}

const LIGHT: ChartTheme = {
  grid: '#E8E7E2',
  tick: '#8A8A8A',
  tickStrong: '#111111',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#E8E7E2',
  tooltipText: '#111111',
  barMuted: '#DEDCD5',
};

const DARK: ChartTheme = {
  grid: '#332F28',
  tick: '#A8A6A0',
  tickStrong: '#F5F3EF',
  tooltipBg: '#221F19',
  tooltipBorder: '#332F28',
  tooltipText: '#F5F3EF',
  barMuted: '#4A453C',
};

export function useChartTheme(): ChartTheme {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return resolvedTheme === 'dark' ? DARK : LIGHT;
}
