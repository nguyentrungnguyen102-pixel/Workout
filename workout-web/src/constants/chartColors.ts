// Curated categorical palette for chart series (v2.14.0) — distinct, high
// contrast hues (validated with the dataviz skill's validate_palette.js,
// light mode: lightness band, chroma floor, CVD-adjacent separation, and
// contrast-vs-surface all pass). Order is fixed — never cycle/reorder at
// runtime; a chart needing more series than the palette length wraps via
// `seriesColor`'s modulo, which only kicks in well past realistic series
// counts (charts here cap at 6).
export const SERIES_PALETTE = [
  '#FF5400', // cam - strength/primary
  '#2563EB', // xanh dương
  '#059669', // xanh lá
  '#7C3AED', // tím
  '#DB2777', // hồng
  '#D97706', // hổ phách
  '#0891B2', // xanh ngọc
  '#DC2626', // đỏ
  '#4F46E5', // chàm
  '#65A30D', // xanh chanh
] as const;

export function seriesColor(i: number): string {
  return SERIES_PALETTE[i % SERIES_PALETTE.length];
}

// Per-category color map for stacked/category charts (WeeklyVolumeChart,
// MuscleRadarChart) — kept separate from CATEGORY_COLORS_STATS (used for
// non-chart pills/badges elsewhere) so chart-specific contrast requirements
// don't ripple into unrelated UI. `dumbbell` is moved to teal here (was
// amber, too close to strength's orange) for clearer separation.
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  strength: '#FF5400',
  core: '#DB2777',
  cardio: '#2563EB',
  mobility: '#059669',
  recovery: '#7C3AED',
  dumbbell: '#0891B2',
  sport: '#CA8A04',
};
