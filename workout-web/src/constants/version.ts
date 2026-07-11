export const APP_VERSION = '1.4.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold web port — 9 pages, responsive layout, GitHub Pages routing' },
  { version: '1.1.0', phase: 2, summary: 'History redesign, exercise goals, workout timestamp, calendar heatmap' },
  { version: '1.2.0', phase: 3, summary: 'Stats period tabs, weekly forecast, core/abs exercises, quick-add button' },
  { version: '1.3.0', phase: 4, summary: 'Weekly per-exercise totals, editable log time, smarter suggestions' },
  { version: '1.4.0', phase: 5, summary: 'Weight (kg) input for strength/dumbbell exercises — wired into PR tracking and history display' },
] as const;
