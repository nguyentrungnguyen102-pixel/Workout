export const APP_VERSION = '1.2.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web (React + Vite + Firebase): 9 pages, responsive sidebar layout, GitHub Pages deploy' },
  { version: '1.1.0', phase: 2, summary: 'History redesign (heatmap/calendar), Exercise Goals, PR tracking, dumbbell + core exercise library, stats period tabs, smart suggestions, weekly forecast, editable log timestamp' },
  { version: '1.2.0', phase: 3, summary: 'Weight (kg) input + volume tracking for dumbbell/strength sets, weight progression chart, removed dead reminderEnabled/reminderTime/fcmToken fields (never wired to any notification system on web)' },
] as const;
