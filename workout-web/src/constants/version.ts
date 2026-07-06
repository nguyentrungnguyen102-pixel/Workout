export const APP_VERSION = '4.1.0';

// Version history for workout-web, tracked independently from workout-tracker (mobile).
// Bump on every merge-worthy phase so a broken release can be traced back to a known-good tag/hotfix point.
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold — Quick Add, History, Body, Stats, Settings, Programs pages; Firebase auth/Firestore; responsive layout; GitHub Pages deploy' },
  { version: '2.0.0', phase: 2, summary: 'History redesign, Exercise Goals, workout timestamp, heatmap + stats strip' },
  { version: '3.0.0', phase: 3, summary: 'Simplified Quick Add input, goals tracking fix, calendar history grid, smart suggestions, stats period tabs, weekly forecast' },
  { version: '4.0.0', phase: 4, summary: 'Core/abs exercises, quick-add button in goals strip, weekly per-exercise totals, editable log time, smarter suggestions' },
  { version: '4.1.0', phase: 5, summary: 'Cleanup: removed dead notification fields (reminderEnabled/reminderTime/fcmToken — never implemented on web), added version/phase tracking' },
] as const;
