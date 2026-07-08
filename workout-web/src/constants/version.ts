export const APP_VERSION = '1.1.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Web port of workout-tracker (mobile) — Quick Add, History, Stats, Body metrics, Programs, Settings, exercise goals, dumbbell (tạ đơn) category, GitHub Pages hosting' },
  { version: '1.1.0', phase: 2, summary: 'Weight (kg) + sets input for strength/dumbbell exercises, fixed Stats volume-progress to use real kg-based volume (was counting reps only) for progressive-overload tracking' },
] as const;
