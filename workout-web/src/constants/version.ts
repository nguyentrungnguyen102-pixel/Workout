export const APP_VERSION = '5.0.0';

export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold workout-web — port all 9 pages + presets (incl. dumbbell) from native app' },
  { version: '2.0.0', phase: 2, summary: 'GitHub Pages deploy — HashRouter/404 SPA routing, Firebase CI fallback, responsive sidebar layout' },
  { version: '3.0.0', phase: 3, summary: 'History redesign, Exercise Goals, heatmap + stats period tabs, weekly forecast, smart suggestions' },
  { version: '4.0.0', phase: 4, summary: 'Core/abs exercises, quick-add from goals strip, weekly per-exercise totals, editable log time' },
  { version: '5.0.0', phase: 5, summary: 'Dumbbell weight (kg) input + volume progressive-overload tracking, parity with native app phase 5' },
] as const;
