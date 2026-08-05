export interface WeightGoalProgress {
  start: number;
  current: number;
  goal: number;
  direction: 'lose' | 'gain' | 'maintain';
  remainingKg: number;
  progressPct: number;
  reached: boolean;
}

// Pure. `start` is the earliest weigh-in still in the loaded history window
// (bodyStore only keeps the 30 most recent body-metric docs — see
// bodyService.ts — so this is "progress since the oldest weigh-in we can
// currently see", not necessarily the user's all-time first entry).
export function computeWeightGoalProgress(
  start: number,
  current: number,
  goal: number
): WeightGoalProgress | null {
  if (!isFinite(start) || !isFinite(current) || !isFinite(goal)) return null;

  if (start === goal) {
    const reached = current === goal;
    return {
      start,
      current,
      goal,
      direction: 'maintain',
      remainingKg: reached ? 0 : Math.round(Math.abs(goal - current) * 10) / 10,
      progressPct: reached ? 100 : 0,
      reached,
    };
  }

  const direction: 'lose' | 'gain' = goal < start ? 'lose' : 'gain';
  const reached = direction === 'lose' ? current <= goal : current >= goal;
  const totalSpan = goal - start;
  const doneSpan = current - start;
  const progressPct = reached ? 100 : Math.max(0, Math.min(100, Math.round((doneSpan / totalSpan) * 100)));
  const remainingKg = reached ? 0 : Math.round(Math.abs(goal - current) * 10) / 10;

  return { start, current, goal, direction, remainingKg, progressPct, reached };
}
