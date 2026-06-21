export const APP_VERSION = '6.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Core workout logging, presets, rest timer, Firestore' },
  { version: '2.0.0', phase: 2, summary: 'Auth, onboarding, streak tracking, weekly stats' },
  { version: '3.0.0', phase: 3, summary: 'Heatmap, PRs, body metrics, custom exercises, 90-day analytics' },
  { version: '4.0.0', phase: 4, summary: 'Exercise progress chart, PR tap-to-explore flow' },
  { version: '5.0.0', phase: 5, summary: 'Home dumbbell exercises (20 presets), dumbbell filter, volume tracking' },
  { version: '6.0.0', phase: 6, summary: 'Weight tracking (sets×reps×kg), multi-set stepper, achievements, weight progress chart' },
] as const;
