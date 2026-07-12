export const APP_VERSION = '5.0.0';

export const PHASE_HISTORY = [
  {
    version: '1.0.0',
    phase: 1,
    summary: 'Scaffold React+Vite port of workout-tracker — all 9 pages, Firestore services/stores, date utils, zero TypeScript errors',
  },
  {
    version: '2.0.0',
    phase: 2,
    summary: 'Responsive layout (sidebar + multi-column desktop/tablet), GitHub Pages SPA routing (HashRouter, 404 redirect, ErrorBoundary), Firebase config fallback for CI, QuickAdd UX cleanup',
  },
  {
    version: '3.0.0',
    phase: 3,
    summary: 'History redesign — heatmap with category colors and labels, stats strip, Exercise Goals with progress tracking, workout timestamps',
  },
  {
    version: '4.0.0',
    phase: 4,
    summary: 'Stats period tabs, weekly forecast, calendar history grid, core/abs exercises, quick-add from goals strip, weekly per-exercise totals, editable log time, smarter suggestions',
  },
  {
    version: '5.0.0',
    phase: 5,
    summary: 'Version tracking parity with mobile app; verified full build/typecheck flow is clean; removed dead saveFcmToken/fcmToken leftover from the ported mobile notification code (reminder banner stays — it is local UI state, not a push notification)',
  },
] as const;
