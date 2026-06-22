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
  achievedDate: string;
  previousBest?: number;
}

function getExBestValues(ex: WorkoutLog['exercises'][0]) {
  let maxReps = ex.reps ?? 0;
  let maxWeight = ex.weight ?? 0;
  let maxDur = ex.durationSeconds ?? 0;

  if (ex.setDetails && ex.setDetails.length > 0) {
    for (const s of ex.setDetails) {
      if ((s.reps ?? 0) > maxReps) maxReps = s.reps!;
      if ((s.weight ?? 0) > maxWeight) maxWeight = s.weight!;
      if ((s.durationSeconds ?? 0) > maxDur) maxDur = s.durationSeconds!;
    }
  }
  return { maxReps, maxWeight, maxDur };
}

export function computePRs(logs: WorkoutLog[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();

  // Process logs sorted oldest → newest so last write = best from most recent improvement
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  for (const log of sorted) {
    for (const ex of log.exercises) {
      const { maxReps, maxWeight, maxDur } = getExBestValues(ex);
      const existing = map.get(ex.presetId);

      if (!existing) {
        map.set(ex.presetId, {
          presetId: ex.presetId,
          name: ex.name,
          category: ex.category,
          unit: ex.unit,
          bestReps: maxReps || undefined,
          bestWeight: maxWeight || undefined,
          bestDurationSeconds: maxDur || undefined,
          bestSets: ex.sets,
          achievedDate: log.date,
        });
      } else {
        let updated = false;
        const next = { ...existing };

        if (ex.unit === 'reps') {
          const curReps = existing.bestReps ?? 0;
          if (maxReps > curReps) {
            next.previousBest = curReps;
            next.bestReps = maxReps;
            next.achievedDate = log.date;
            updated = true;
          }
          if (maxWeight > 0 && maxWeight > (existing.bestWeight ?? 0)) {
            next.bestWeight = maxWeight;
            next.achievedDate = log.date;
            updated = true;
          }
        } else {
          const curDur = existing.bestDurationSeconds ?? 0;
          if (maxDur > curDur) {
            next.previousBest = curDur;
            next.bestDurationSeconds = maxDur;
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
