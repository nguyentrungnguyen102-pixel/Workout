import { WorkoutLog } from '../types/workout';
import { UserProfile, ExerciseGoal } from '../types/user';

export interface WeeklyPlanItem {
  presetId: string;
  name: string;
  done: number;
  target: number;
  pct: number; // 0-100, capped
  isDuration: boolean; // duration goal (values are seconds) vs reps goal
}

export interface WeeklyPlanScore {
  score: number; // 0-100, average of enabled-goal percentages
  items: WeeklyPlanItem[]; // one per enabled ExerciseGoal
  sessions: number;
  totalReps: number;
}

// Monday (week start) of the week containing dateStr, as YYYY-MM-DD (local).
// lib/date.ts has an internal mondayOf(dateStr): Date helper but does not
// export it, so it's re-implemented here (same "day-of-week shifted to
// Monday=0" approach used by dayTimeline.ts's weekStartStr()) rather than
// changing that file's exports.
export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  d.setDate(d.getDate() - dow);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function logsInWeek(logs: WorkoutLog[], weekStartDate: string): WorkoutLog[] {
  const weekEnd = addDaysStr(weekStartDate, 6);
  return (logs || []).filter((l) => l && l.date && l.date >= weekStartDate && l.date <= weekEnd);
}

// Minutes for one log. Mirrors the estimate used at write time in
// services/workoutService.ts's logWorkout() (read there, not modified here):
// unit minutes/seconds exercises count durationSeconds/60, everything else
// (reps-based exercises) counts as ~3 minutes. Old logs can be missing
// totalDurationMinutes entirely, so that field is only trusted when it's a
// positive number; otherwise this re-derives it from the exercises.
export function estimateLogMinutes(log: WorkoutLog): number {
  if (typeof log.totalDurationMinutes === 'number' && log.totalDurationMinutes > 0) {
    return log.totalDurationMinutes;
  }
  const exercises = log.exercises || [];
  if (exercises.length === 0) return 0;
  const minutes = exercises.reduce((sum, e) => {
    if (e.unit === 'minutes' || e.unit === 'seconds') return sum + (e.durationSeconds || 0) / 60;
    return sum + 3;
  }, 0);
  return Math.max(1, Math.round(minutes));
}

// Counting convention matches GoalsStrip exactly (getGoalCurrent /
// getWeeklyGoal / sumThisWeek in pages/QuickAddPage.tsx + lib/dayTimeline.ts):
// done = RAW reps (not sets×reps) or raw durationSeconds; weekly target =
// (targetReps ?? targetDurationSeconds) × weeklyGoalSessions. Any other
// formula makes this card disagree with the goal bars right below it on the
// Home page, which reads as broken numbers.
function computeGoalItem(goal: ExerciseGoal, weekLogs: WorkoutLog[], sessionsPerWeek: number): WeeklyPlanItem {
  let done = 0;
  for (const l of weekLogs) {
    for (const ex of l.exercises || []) {
      if (ex.presetId !== goal.presetId) continue;
      if (goal.targetReps) done += ex.reps || 0;
      else if (goal.targetDurationSeconds) done += ex.durationSeconds || 0;
    }
  }
  const dailyTarget = goal.targetReps ?? goal.targetDurationSeconds ?? 0;
  const target = dailyTarget * Math.max(1, sessionsPerWeek);
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return {
    presetId: goal.presetId,
    name: goal.name,
    done,
    target,
    pct,
    isDuration: !goal.targetReps && !!goal.targetDurationSeconds,
  };
}

// Hand-calculated cases (no test runner in this repo):
//
// Case A — reps goal: { targetReps: 20 }, weeklyGoalSessions = 5 -> weekly
//   target = 100; week logs contain raw reps totalling 60 -> pct = 60.
//   (Matches GoalsStrip's weekly bar for the same goal.)
// Case B — duration goal (chạy bộ): { targetDurationSeconds: 1800 },
//   sessions 5 -> target 9000s; done 3600s -> pct = 40; the card displays
//   "60/150 phút", never raw seconds.
// Case C — no goals enabled -> returns null (card hidden). Weekly minutes
//   are intentionally NOT part of this score (owner doesn't track them).
export function computeWeeklyPlan(
  logs: WorkoutLog[],
  profile: UserProfile | null,
  weekStartDate: string
): WeeklyPlanScore | null {
  const weekLogs = logsInWeek(logs, weekStartDate);
  const goals = (profile?.exerciseGoals || []).filter((g) => g.enabled);
  const sessionsPerWeek = Math.max(1, profile?.weeklyGoalSessions || 5);

  const items: WeeklyPlanItem[] = goals.map((g) => computeGoalItem(g, weekLogs, sessionsPerWeek));

  if (items.length === 0) return null;

  const score = Math.round(items.reduce((s, it) => s + it.pct, 0) / items.length);

  let totalReps = 0;
  for (const l of weekLogs) {
    for (const ex of l.exercises || []) {
      if (ex.unit === 'reps') totalReps += ex.reps || 0;
    }
  }

  return {
    score,
    items,
    sessions: weekLogs.length,
    totalReps,
  };
}
