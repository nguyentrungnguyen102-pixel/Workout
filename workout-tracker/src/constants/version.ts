export const APP_VERSION = '5.1.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Core workout logging, presets, rest timer, Firestore' },
  { version: '2.0.0', phase: 2, summary: 'Auth, onboarding, streak tracking, weekly stats, push token' },
  { version: '3.0.0', phase: 3, summary: 'Heatmap, PRs, body metrics, custom exercises, 90-day analytics' },
  { version: '4.0.0', phase: 4, summary: 'Local notification scheduling, exercise progress chart (per-PR bar chart), tap-PR-to-explore flow' },
  { version: '5.0.0', phase: 5, summary: 'Home dumbbell exercises (20 presets), dumbbell category filter, volume progressive overload tracking, notification removal (Expo Go compat)' },
  { version: '5.1.0', phase: 5, summary: 'Hotfix: remove dead notificationService.ts stub + unused expo-notifications dependency left over from the Expo Go compatibility fix' },
] as const;
