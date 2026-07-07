export const APP_VERSION = '1.1.0';

// Version history for workout-web, tracked independently from workout-tracker (mobile).
// Bump on every merge-worthy change so a broken release can be traced back to
// a known-good point for hotfixing or rollback.
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold — Quick Add, History, Body, Stats, Settings, Programs pages; Firebase auth/Firestore; responsive layout; GitHub Pages deploy; dumbbell exercise library' },
  { version: '1.1.0', phase: 2, summary: 'Bugfix pass: Firestore queries missing orderBy before limit() (dropped recent logs past the doc window), month/week "days trained" undercounted by a doc-count cap instead of a date range, local/UTC date mismatch in suggestion cutoff, light/moderate/high suggestions collapsing to the same value, removed dead notification fields (reminderEnabled/reminderTime/fcmToken — never implemented on web), version tracking added' },
] as const;
