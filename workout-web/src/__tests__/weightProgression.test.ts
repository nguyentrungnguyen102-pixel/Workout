import { describe, it, expect } from 'vitest';
import { suggestNextWeight, sessionsForExercise } from '../lib/weightProgression';
import { WorkoutLog } from '../types/workout';

const log = (date: string, weight: number | undefined, reps: number, presetId = 'db_bicep_curl'): WorkoutLog =>
  ({
    id: date + presetId, userId: 'u', date, totalDurationMinutes: 0, intensityScore: 0, intensity: 'light',
    caloriesEstimate: 0, source: 'manual', syncedToSheets: false,
    exercises: [{ presetId, name: presetId, category: 'dumbbell', unit: 'reps', sets: 3, reps, weight }],
  }) as WorkoutLog;

describe('weightProgression', () => {
  it('suggests +2.5kg after 2 straight sessions hitting top reps at same weight', () => {
    const r = suggestNextWeight([log('2026-10-01', 10, 12), log('2026-10-03', 10, 14)], 'db_bicep_curl');
    expect(r?.nextWeight).toBe(12.5);
    expect(r?.currentWeight).toBe(10);
  });
  it('no suggestion when only one session', () => {
    expect(suggestNextWeight([log('2026-10-03', 10, 15)], 'db_bicep_curl')).toBeNull();
  });
  it('no suggestion when latest session misses top reps', () => {
    expect(suggestNextWeight([log('2026-10-01', 10, 12), log('2026-10-03', 10, 9)], 'db_bicep_curl')).toBeNull();
  });
  it('no suggestion when weight changed between sessions', () => {
    expect(suggestNextWeight([log('2026-10-01', 7.5, 12), log('2026-10-03', 10, 12)], 'db_bicep_curl')).toBeNull();
  });
  it('ignores entries without weight and other exercises', () => {
    const logs = [log('2026-10-01', undefined, 15), log('2026-10-02', 10, 15, 'db_lunge')];
    expect(sessionsForExercise(logs, 'db_bicep_curl')).toEqual([]);
  });
  it('takes the heaviest set per day, newest first', () => {
    const logs = [log('2026-10-01', 5, 12), log('2026-10-01', 7.5, 8), log('2026-10-03', 10, 12)];
    const s = sessionsForExercise(logs, 'db_bicep_curl');
    expect(s.map((x) => x.weight)).toEqual([10, 7.5]);
  });
});
