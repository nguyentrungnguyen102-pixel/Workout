export const WEB_VERSION = '6.0.0';

export const PHASE_HISTORY = [
  { version: '1.x (mobile)', phase: 1, summary: 'Core workout logging, presets, rest timer, Firestore' },
  { version: '2.x (mobile)', phase: 2, summary: 'Auth, onboarding, streak tracking, weekly stats' },
  { version: '3.x (mobile)', phase: 3, summary: 'Heatmap, PRs, body metrics, custom exercises, analytics' },
  { version: '4.x (mobile)', phase: 4, summary: 'Training programs, workout templates, exercise progress' },
  { version: '5.x (mobile+web)', phase: 5, summary: 'Dumbbell home exercises (20 presets), web app launch, volume tracking' },
  { version: '6.0.0', phase: 6, summary: 'Weight & sets tracking per exercise, 1RM estimate (Epley), weight/volume progress charts' },
] as const;
