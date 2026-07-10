// Version history for workout-web (React + Vite port of workout-tracker).
// Bump APP_VERSION and append to PHASE_HISTORY on every merged phase so a
// broken release can be traced back to its phase and reverted via git tag
// `web-v<version>`.

export const APP_VERSION = '1.6.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold — React+Vite port, Firebase auth/Firestore, 9 core pages, GitHub Pages deploy' },
  { version: '1.1.0', phase: 2, summary: 'HashRouter blank-screen fix, 404 SPA redirect, responsive desktop/tablet layout, QuickAdd UX cleanup' },
  { version: '1.2.0', phase: 3, summary: 'History redesign, Exercise Goals, workout timestamps, heatmap fixes' },
  { version: '1.3.0', phase: 4, summary: 'Goals tracking fixes, 4-week calendar history grid, smart suggestions' },
  { version: '1.4.0', phase: 5, summary: 'Simplified input, calendar history polish, smarter suggestions' },
  { version: '1.5.0', phase: 6, summary: 'Stats period tabs, weekly forecast, double-height calendar week, core/abs exercises, quick-add goal button' },
  { version: '1.6.0', phase: 7, summary: 'Weekly per-exercise totals, editable log time, smarter suggestions, version tracking, QA pass' },
] as const;
