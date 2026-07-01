export const APP_VERSION = '1.6.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold — React+Vite web port, all 9 pages, date utils, zero TS errors' },
  { version: '1.1.0', phase: 2, summary: 'Production hardening — responsive layout, GitHub Pages SPA routing, Firebase CI fallback, QuickAdd UX polish' },
  { version: '1.2.0', phase: 3, summary: 'History redesign — Exercise Goals, heatmap, category colors, stats strip' },
  { version: '1.3.0', phase: 4, summary: 'Goals + calendar fixes, simplified input, smart suggestions' },
  { version: '1.4.0', phase: 5, summary: 'Stats period tabs, weekly forecast, core/abs exercises, dumbbell category' },
  { version: '1.5.0', phase: 6, summary: 'Weekly per-exercise totals, editable log time, smarter suggestions' },
  { version: '1.6.0', phase: 7, summary: 'Fix onboarding routing (new users skipped goal setup), fix broken join-date field, remove dead notification fields (reminderEnabled/reminderTime/fcmToken)' },
] as const;
