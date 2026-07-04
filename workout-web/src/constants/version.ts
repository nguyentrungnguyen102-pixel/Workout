export const APP_VERSION = '1.4.0';

// Retroactively reconstructed from git history, then continued forward.
// Bump this on every merged phase so hotfixes/rollbacks can reference a version.
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold — Vite+React+Tailwind, Firebase auth, all 9 pages, zero TS errors' },
  { version: '1.1.0', phase: 2, summary: 'Responsive layout (sidebar/multi-column), HashRouter + ErrorBoundary, GitHub Pages SPA routing fix' },
  { version: '1.2.0', phase: 3, summary: 'History redesign (heatmap + calendar), Exercise Goals, editable workout timestamp' },
  { version: '1.3.0', phase: 4, summary: 'Training Programs, Stats period tabs + weekly forecast, core/abs + dumbbell (home) exercises, smarter suggestions, weekly per-exercise totals' },
  { version: '1.4.0', phase: 5, summary: 'Weight (kg) input for reps-based exercises enabling weight PRs, delete saved templates, removed dead notification fields (reminderEnabled/reminderTime/fcmToken), fixed onboarding stuck-save bug, version tracking added' },
] as const;
