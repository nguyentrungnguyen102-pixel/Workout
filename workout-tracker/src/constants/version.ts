export const APP_VERSION = '5.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Core workout logging, presets, rest timer, Firestore' },
  { version: '2.0.0', phase: 2, summary: 'Auth, onboarding, streak tracking, weekly stats, push token' },
  { version: '3.0.0', phase: 3, summary: 'Heatmap, PRs, body metrics, custom exercises, 90-day analytics' },
  { version: '4.0.0', phase: 4, summary: 'Local notification scheduling, exercise progress chart (per-PR bar chart), tap-PR-to-explore flow' },
  { version: '5.0.0', phase: 5, summary: 'Home dumbbell workout library (19 exercises, 34 total), equipment filter in picker, 2 dumbbell programs (3x & Upper/Lower 4x), removed notification UI' },
] as const;
