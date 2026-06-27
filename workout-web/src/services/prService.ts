import { WorkoutLog } from '../types/workout';

export interface PersonalRecord {
  presetId: string;
  name: string;
  category: string;
  unit: string;
  bestReps?: number;
  bestWeight?: number;
  bestDurationSeconds?: number;
  bestSets?: number;
  bestVolume?: number;       // weight * reps * sets
  best1RM?: number;          // Epley estimate (kg)
  achievedDate: string;
  previousBest?: number;
}

/** Epley 1RM estimate: weight × (1 + reps/30) */
export function estimate1RM(reps: number, weight: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function computePRs(logs: WorkoutLog[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  for (const log of sorted) {
    for (const ex of log.exercises) {
      const existing = map.get(ex.presetId);
      const volume = ex.weight && ex.reps ? ex.weight * ex.reps * (ex.sets || 1) : 0;
      const oneRM = ex.weight && ex.reps ? estimate1RM(ex.reps, ex.weight) : 0;

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
          bestVolume: volume || undefined,
          best1RM: oneRM || undefined,
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
          if (volume && (!existing.bestVolume || volume > existing.bestVolume)) {
            next.bestVolume = volume;
            updated = true;
          }
          if (oneRM && (!existing.best1RM || oneRM > existing.best1RM)) {
            next.best1RM = oneRM;
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
