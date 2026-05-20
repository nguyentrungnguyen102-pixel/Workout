import { WorkoutLog, ExerciseEntry } from '../types/workout';

export interface PersonalRecord {
  presetId: string;
  name: string;
  category: string;
  unit: string;
  bestReps?: number;
  bestWeight?: number;
  bestDurationSeconds?: number;
  bestSets?: number;
  achievedDate: string;
  previousBest?: number;
}

export function computePRs(logs: WorkoutLog[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  // Process logs sorted oldest → newest so last write = best from most recent improvement
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  for (const log of sorted) {
    for (const ex of log.exercises) {
      const existing = map.get(ex.presetId);

      if (!existing) {
        map.set(ex.presetId, {
          presetId: ex.presetId,
          name: ex.name,
          category: ex.category,
          unit: ex.unit,
          bestReps: ex.reps,
          bestWeight: ex.weight,
          bestDurationSeconds: ex.durationSeconds,
          bestSets: ex.sets,
          achievedDate: log.date,
        });
      } else {
        let updated = false;
        const next = { ...existing };

        if (ex.unit === 'reps') {
          const newReps = ex.reps ?? 0;
          const curReps = existing.bestReps ?? 0;
          if (newReps > curReps) {
            next.previousBest = curReps;
            next.bestReps = newReps;
            next.achievedDate = log.date;
            updated = true;
          }
          if (ex.weight && (!existing.bestWeight || ex.weight > existing.bestWeight)) {
            next.bestWeight = ex.weight;
            next.achievedDate = log.date;
            updated = true;
          }
        } else {
          const newDur = ex.durationSeconds ?? 0;
          const curDur = existing.bestDurationSeconds ?? 0;
          if (newDur > curDur) {
            next.previousBest = curDur;
            next.bestDurationSeconds = newDur;
            next.achievedDate = log.date;
            updated = true;
          }
        }
        if (updated) map.set(ex.presetId, next);
      }
    }
  }

  return Array.from(map.values());
}

export function getPRLabel(pr: PersonalRecord): string {
  if (pr.unit === 'reps') {
    const parts: string[] = [];
    if (pr.bestReps) parts.push(`${pr.bestReps} reps`);
    if (pr.bestWeight) parts.push(`${pr.bestWeight} kg`);
    return parts.join(' · ') || '--';
  }
  if (pr.unit === 'seconds' && pr.bestDurationSeconds) {
    return `${pr.bestDurationSeconds}s`;
  }
  if (pr.unit === 'minutes' && pr.bestDurationSeconds) {
    return `${Math.round(pr.bestDurationSeconds / 60)} phút`;
  }
  return '--';
}
