import { describe, it, expect } from 'vitest';
import { buildMuscleRecovery } from '../lib/muscleRecovery';
import { todayString, daysAgoString } from '../lib/date';
import { WorkoutLog } from '../types/workout';

function mkLog(date: string, presetId: string): WorkoutLog {
  return {
    id: date + presetId,
    userId: 'u1',
    date,
    exercises: [{ presetId, name: presetId, category: 'strength', unit: 'reps', sets: 3, reps: 10 }],
    totalDurationMinutes: 10,
    intensityScore: 1,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  };
}

describe('buildMuscleRecovery', () => {
  it('marks a group with no logged entry as no_data', () => {
    const rows = buildMuscleRecovery([]);
    expect(rows.every((r) => r.status === 'no_data' && r.daysSince === null)).toBe(true);
  });

  it('marks a group trained today as trained_today', () => {
    const rows = buildMuscleRecovery([mkLog(todayString(), 'pushup')]); // chest
    const chest = rows.find((r) => r.group === 'chest')!;
    expect(chest.status).toBe('trained_today');
    expect(chest.daysSince).toBe(0);
  });

  it('marks a group trained yesterday as recovering', () => {
    const rows = buildMuscleRecovery([mkLog(daysAgoString(1), 'squat')]); // legs
    const legs = rows.find((r) => r.group === 'legs')!;
    expect(legs.status).toBe('recovering');
    expect(legs.daysSince).toBe(1);
  });

  it('marks a group trained 2+ days ago as ready', () => {
    const rows = buildMuscleRecovery([mkLog(daysAgoString(2), 'pullup')]); // back
    const back = rows.find((r) => r.group === 'back')!;
    expect(back.status).toBe('ready');
    expect(back.daysSince).toBe(2);
  });

  it('uses the most recent session when a group was trained multiple times', () => {
    const rows = buildMuscleRecovery([mkLog(daysAgoString(5), 'pushup'), mkLog(todayString(), 'pushup')]);
    const chest = rows.find((r) => r.group === 'chest')!;
    expect(chest.status).toBe('trained_today');
    expect(chest.daysSince).toBe(0);
  });

  it('covers every muscle group key exactly once', () => {
    const rows = buildMuscleRecovery([]);
    expect(rows.map((r) => r.group).sort()).toEqual(
      ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'fullBody'].sort()
    );
  });

  it('falls back to fullBody for an unknown presetId', () => {
    const rows = buildMuscleRecovery([mkLog(todayString(), 'some_unmapped_custom_id')]);
    const fullBody = rows.find((r) => r.group === 'fullBody')!;
    expect(fullBody.status).toBe('trained_today');
  });
});
