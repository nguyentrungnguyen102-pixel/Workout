export const APP_VERSION = '1.3.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web (React + Vite port of workout-tracker) — all 9 pages, date utils, zero TypeScript errors' },
  { version: '1.1.0', phase: 2, summary: 'GitHub Pages deploy fixes (HashRouter, ErrorBoundary, 404.html), Firebase config fallback, responsive sidebar/multi-column layout, QuickAdd UX polish' },
  { version: '1.2.0', phase: 3, summary: 'History redesign + heatmap fix, Exercise Goals, stats period tabs, weekly forecast, smart suggestions, core/abs exercises, weekly per-exercise totals' },
  { version: '1.3.0', phase: 4, summary: 'Cleanup: removed dead reminder/fcmToken fields (notification pipeline was never wired to a client — no push token registration existed), added version tracking' },
] as const;
