import { WorkoutLog } from '../types/workout';
import { UserProfile, ExerciseGoal } from '../types/user';

export interface WeeklyPlanItem {
  presetId: string;
  name: string;
  done: number;
  target: number;
  pct: number; // 0-100, capped
}

export interface WeeklyPlanScore {
  score: number; // 0-100, average of all components
  items: WeeklyPlanItem[]; // one per enabled ExerciseGoal
  minutesDone: number;
  minutesTarget: number;
  minutesPct: number; // 0-100, capped
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
function estimateLogMinutes(log: WorkoutLog): number {
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

function computeGoalItem(goal: ExerciseGoal, weekLogs: WorkoutLog[], sessionsPerWeek: number): WeeklyPlanItem {
  let done = 0;
  for (const l of weekLogs) {
    for (const ex of l.exercises || []) {
      if (ex.presetId !== goal.presetId) continue;
      if (goal.targetReps) done += (ex.sets || 1) * (ex.reps || 0);
      else if (goal.targetDurationSeconds) done += ex.durationSeconds || 0;
    }
  }
  // Weekly target = daily target × sessionsPerWeek. This mirrors the
  // convention GoalsStrip already uses on the Home page (see
  // getWeeklyGoal() in pages/QuickAddPage.tsx: `dailyTarget * Math.max(1,
  // sessionsPerWeek)`), NOT a flat ×7 — a goal is meant to be hit on the
  // user's planned training days per week, not literally every calendar
  // day. Kept consistent here so this card's numbers agree with the
  // per-goal weekly bars already shown in GoalsStrip.
  const dailyTarget = goal.targetReps
    ? goal.targetSets * goal.targetReps
    : (goal.targetDurationSeconds || 0);
  const target = dailyTarget * sessionsPerWeek;
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return { presetId: goal.presetId, name: goal.name, done, target, pct };
}

// Hand-calculated cases (used to sanity-check this implementation; there is
// no test runner in this repo — see W3.4 in the task notes):
//
// Case A — goal + minutes both present:
//   goal { presetId:'pushup', targetSets:3, targetReps:10, enabled:true } (dailyTarget=30)
//   profile.weeklyGoalSessions = 5 -> weekly target = 150
//   week logs contain pushup entries totalling sets*reps = 90 -> pct = round(90/150*100) = 60
//   weeklyGoalMinutes = 100, minutesDone = 80 -> minutesPct = 80
//   score = round((60 + 80) / 2) = 70
//
// Case B — log missing totalDurationMinutes:
//   log.exercises = [{ unit:'reps', sets:3, reps:10 }, { unit:'seconds', durationSeconds:120 }]
//   estimateLogMinutes = round(3 + 120/60) = round(5) = 5 (no NaN, no crash)
//
// Case C — no goals enabled, only weeklyGoalMinutes set:
//   items = [], minutesPct computed normally, score = minutesPct alone (single component average)
//
// Case D — neither goals nor weeklyGoalMinutes set:
//   components.length === 0 -> computeWeeklyPlan returns null (caller hides the card)
export function computeWeeklyPlan(
  logs: WorkoutLog[],
  profile: UserProfile | null,
  weekStartDate: string
): WeeklyPlanScore | null {
  const weekLogs = logsInWeek(logs, weekStartDate);
  const goals = (profile?.exerciseGoals || []).filter((g) => g.enabled);
  const sessionsPerWeek = Math.max(1, profile?.weeklyGoalSessions || 5);

  const items: WeeklyPlanItem[] = goals.map((g) => computeGoalItem(g, weekLogs, sessionsPerWeek));

  const weeklyGoalMinutes = profile?.weeklyGoalMinutes || 0;
  const minutesDone = weekLogs.reduce((sum, l) => sum + estimateLogMinutes(l), 0);
  const minutesPct = weeklyGoalMinutes > 0 ? Math.min(100, Math.round((minutesDone / weeklyGoalMinutes) * 100)) : 0;

  const components: number[] = items.map((it) => it.pct);
  if (weeklyGoalMinutes > 0) components.push(minutesPct);

  if (components.length === 0) return null;

  const score = Math.round(components.reduce((s, v) => s + v, 0) / components.length);

  let totalReps = 0;
  for (const l of weekLogs) {
    for (const ex of l.exercises || []) {
      if (ex.unit === 'reps') totalReps += (ex.sets || 1) * (ex.reps || 0);
    }
  }

  return {
    score,
    items,
    minutesDone: Math.round(minutesDone),
    minutesTarget: weeklyGoalMinutes,
    minutesPct,
    sessions: weekLogs.length,
    totalReps,
  };
}
