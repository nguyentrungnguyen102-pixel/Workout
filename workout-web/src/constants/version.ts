export const APP_VERSION = '1.7.0';

// Mirrors workout-tracker/src/constants/version.ts's phase convention so the
// two codebases can be cross-referenced when merging or rolling back a hotfix.
export const PHASE_HISTORY = [
  { version: '1.0.0', phase: 1, summary: 'Scaffold web port — 9 pages, Firebase auth, responsive sidebar/multi-column layout' },
  { version: '1.1.0', phase: 2, summary: 'GitHub Pages routing fixes (HashRouter, 404 redirect), History redesign + Exercise Goals + workout timestamp, heatmap fixes' },
  { version: '1.2.0', phase: 3, summary: 'Goals refresh fix, 4-week history grid, simplified quick-add input, calendar history, smart suggestions' },
  { version: '1.3.0', phase: 4, summary: 'Stats period tabs, weekly forecast, double-height calendar week' },
  { version: '1.4.0', phase: 5, summary: 'Core/abs exercises, quick-add button in goals strip' },
  { version: '1.5.0', phase: 6, summary: 'Weekly per-exercise totals, editable log time, smarter suggestions' },
  {
    version: '1.7.0',
    phase: 7,
    summary:
      'QA/stabilization pass: Firestore rules fix for templates + custom-exercise delete, ' +
      'cross-account store leak on sign-out, race-condition guards (log/day/exercise detail), ' +
      'duration-input clamp, body-metric validation, program-cycle progress bug, removed dead notification fields',
  },
] as const;
