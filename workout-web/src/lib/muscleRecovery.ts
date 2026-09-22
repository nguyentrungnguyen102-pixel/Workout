import { WorkoutLog } from '../types/workout';
import { MUSCLE_GROUP_KEYS, MUSCLE_GROUP_LABELS, PRESET_MUSCLE_GROUP } from '../constants/exercises';
import { daysBetween, todayString } from './date';

// Simple in-app heuristic (not a clinical/exercise-science citation, same
// spirit as coach.ts's consistency/progression dims) for the "nhóm cơ nào
// nên tập hôm nay" question top fitness apps (Fitbod, Freeletics) answer
// with a recovery indicator: a muscle group trained today or yesterday is
// still recovering, 2+ days clear reads as ready again. Deliberately not
// wired into buildFitnessAssessment's composite score in coach.ts — this is
// a same-day "what to train" nudge, not a fitness-level dimension.
const RECOVERING_WITHIN_DAYS = 1;

export type RecoveryStatus = 'trained_today' | 'recovering' | 'ready' | 'no_data';

export interface MuscleRecoveryRow {
  group: string;
  label: string;
  lastTrainedDate: string | null;
  daysSince: number | null;
  status: RecoveryStatus;
}

// logs should be the caller's recent-logs window (QuickAddPage's 35-day
// recentLogs) — recovery only ever looks a couple of days back, so any
// window covering at least that is equivalent; a group with no entry at
// all in the window reports 'no_data' (never means "definitely never
// trained", just "not recently enough to matter here").
export function buildMuscleRecovery(logs: WorkoutLog[]): MuscleRecoveryRow[] {
  const today = todayString();
  const lastDateByGroup = new Map<string, string>();
  for (const log of logs) {
    if (!log.date) continue;
    for (const ex of log.exercises || []) {
      const group = PRESET_MUSCLE_GROUP[ex.presetId] || 'fullBody';
      const existing = lastDateByGroup.get(group);
      if (!existing || log.date > existing) lastDateByGroup.set(group, log.date);
    }
  }

  return MUSCLE_GROUP_KEYS.map((group) => {
    const label = MUSCLE_GROUP_LABELS[group];
    const lastTrainedDate = lastDateByGroup.get(group) || null;
    if (!lastTrainedDate) {
      return { group, label, lastTrainedDate: null, daysSince: null, status: 'no_data' as RecoveryStatus };
    }
    const daysSince = daysBetween(lastTrainedDate, today);
    const status: RecoveryStatus =
      daysSince <= 0 ? 'trained_today' : daysSince <= RECOVERING_WITHIN_DAYS ? 'recovering' : 'ready';
    return { group, label, lastTrainedDate, daysSince, status };
  });
}
