export const APP_VERSION = '6.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Core logging, auth, streak, history, body tracking, stats, exercise progress chart, PRs' },
  { version: '2.0.0', phase: 2, summary: 'Responsive sidebar desktop + bottom nav mobile, month calendar, goals tracking, templates' },
  { version: '3.0.0', phase: 3, summary: 'Goals strip, smart suggestions, compact QuickAdd, week-grouped history, compact header' },
  { version: '4.0.0', phase: 4, summary: 'Month calendar full, history redesign, exercise goals, workout timestamp' },
  { version: '5.0.0', phase: 5, summary: 'Dumbbell exercises (20 presets), category filter (tạ đơn tab), dumbbell home 3x/week program' },
  { version: '6.0.0', phase: 6, summary: 'Weight + sets tracking in log modal, weight progression chart, pre-fill weight from history, intermediate dumbbell 4x/week program' },
] as const;
