import { describe, it, expect } from 'vitest';
import { computeNewPRs, computePRs, getPRLabel } from '../services/prService';
import { WorkoutLog } from '../types/workout';

function makeLog(id: string, date: string, ex: Partial<WorkoutLog['exercises'][number]>): WorkoutLog {
  return {
    id,
    userId: 'test-user',
    date,
    exercises: [
      {
        presetId: 'db_bicep_curl',
        name: 'Curl tạ đơn',
        category: 'dumbbell',
        unit: 'reps',
        sets: 3,
        ...ex,
      },
    ],
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  } as unknown as WorkoutLog;
}

describe('computeNewPRs — reps unit', () => {
  it('flags a new PR when reps increase over the prior best', () => {
    const existing = [makeLog('l1', '2026-07-01', { reps: 10 })];
    const newLog = makeLog('l2', '2026-07-10', { reps: 12 });
    const prs = computeNewPRs(existing, newLog);
    expect(prs).toHaveLength(1);
    expect(prs[0].bestReps).toBe(12);
    expect(prs[0].previousBest).toBe(10);
  });

  it('does not flag a PR when reps stay the same or drop', () => {
    const existing = [makeLog('l1', '2026-07-01', { reps: 10 })];
    const newLog = makeLog('l2', '2026-07-10', { reps: 8 });
    expect(computeNewPRs(existing, newLog)).toHaveLength(0);
  });

  it('is not a PR on the first-ever time an exercise is logged', () => {
    const newLog = makeLog('l1', '2026-07-10', { reps: 12 });
    expect(computeNewPRs([], newLog)).toHaveLength(0);
  });
});

describe('computeNewPRs — km unit (regression: distance-based custom exercises)', () => {
  // Bug: computePRs/computeNewPRs only branched on unit === 'reps' vs a
  // duration (durationSeconds) fallback. A 'km'-unit custom exercise (e.g. a
  // user-created outdoor run tracked by distance) has no durationSeconds, so
  // the fallback branch always compared 0 > 0 — never true — meaning a km
  // exercise could never register a PR no matter how far the user ran, and
  // the "PR mới 🏆" toast never fired for it.
  function kmLog(id: string, date: string, distance: number): WorkoutLog {
    return {
      id,
      userId: 'test-user',
      date,
      exercises: [
        { presetId: 'custom_run', name: 'Chạy ngoài trời', category: 'cardio', unit: 'km', sets: 1, distance },
      ],
      totalDurationMinutes: 10,
      intensityScore: 5,
      intensity: 'moderate',
      caloriesEstimate: 50,
      source: 'manual',
      syncedToSheets: false,
    } as unknown as WorkoutLog;
  }

  it('flags a new PR when distance increases', () => {
    const existing = [kmLog('l1', '2026-07-01', 3)];
    const newLog = kmLog('l2', '2026-07-10', 5);
    const prs = computeNewPRs(existing, newLog);
    expect(prs).toHaveLength(1);
    expect(prs[0].bestDistance).toBe(5);
    expect(prs[0].previousBest).toBe(3);
    expect(getPRLabel(prs[0])).toBe('5 km');
  });

  it('does not flag a PR when distance stays the same or drops', () => {
    const existing = [kmLog('l1', '2026-07-01', 5)];
    const newLog = kmLog('l2', '2026-07-10', 4);
    expect(computeNewPRs(existing, newLog)).toHaveLength(0);
  });

  it('computePRs tracks bestDistance across a full history', () => {
    const logs = [kmLog('l1', '2026-07-01', 3), kmLog('l2', '2026-07-05', 7), kmLog('l3', '2026-07-08', 5)];
    const prs = computePRs(logs);
    expect(prs).toHaveLength(1);
    expect(prs[0].bestDistance).toBe(7);
  });
});

describe('getPRLabel', () => {
  it('formats reps + weight', () => {
    expect(getPRLabel({ presetId: 'x', name: 'X', category: 'dumbbell', unit: 'reps', bestReps: 12, bestWeight: 10, achievedDate: '2026-01-01' })).toBe('12 reps · 10 kg');
  });

  it('formats seconds and minutes', () => {
    expect(getPRLabel({ presetId: 'x', name: 'X', category: 'core', unit: 'seconds', bestDurationSeconds: 90, achievedDate: '2026-01-01' })).toBe('90s');
    expect(getPRLabel({ presetId: 'x', name: 'X', category: 'cardio', unit: 'minutes', bestDurationSeconds: 600, achievedDate: '2026-01-01' })).toBe('10 phút');
  });
});
