export const APP_VERSION = '6.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web — React + Vite web port, Firebase auth, Quick Add, History, Stats, Body, Settings' },
  { version: '2.0.0', phase: 2, summary: 'Responsive layout (sidebar + multi-column), 404 SPA routing, HashRouter fix' },
  { version: '3.0.0', phase: 3, summary: 'History redesign, Exercise Goals, heatmap fixes, timestamp fallback' },
  { version: '4.0.0', phase: 4, summary: 'Stats period tabs, weekly forecast, smart suggestions, editable log time' },
  { version: '5.0.0', phase: 5, summary: 'Core/abs exercises, quick-add from goals strip, weekly per-exercise totals' },
  { version: '6.0.0', phase: 6, summary: 'Weight (kg) tracking parity with mobile — dumbbell/strength weight input, tonnage-based volume progress, weight PR charting' },
] as const;
