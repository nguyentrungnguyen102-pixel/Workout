export const APP_VERSION = '5.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Core workout logging, presets, rest timer, Firestore' },
  { version: '2.0.0', phase: 2, summary: 'Auth, onboarding, streak tracking, weekly stats, push token' },
  { version: '3.0.0', phase: 3, summary: 'Heatmap, PRs, body metrics, custom exercises, 90-day analytics' },
  { version: '4.0.0', phase: 4, summary: 'Local notification scheduling, exercise progress chart (per-PR bar chart), tap-PR-to-explore flow, training programs, workout templates' },
  { version: '5.0.0', phase: 5, summary: 'Dumbbell home workout: 10 tạ đơn presets, 2 chương trình tạ đơn (Toàn thân 3x + Upper/Lower 4x), bỏ notification UI' },
] as const;
