import { describe, it, expect } from 'vitest';
import { computeLogMetrics } from '../lib/logMetrics';
import { ExerciseEntry } from '../types/workout';

const pushups: ExerciseEntry = {
  presetId: 'pushup',
  name: 'Hít đất',
  category: 'strength',
  unit: 'reps',
  sets: 3,
  reps: 20,
};

const dbCurl: ExerciseEntry = {
  presetId: 'db_bicep_curl',
  name: 'Cuốn tạ tay trước',
  category: 'dumbbell',
  unit: 'reps',
  sets: 3,
  reps: 12,
  weight: 10,
};

describe('computeLogMetrics', () => {
  it('throws on an empty exercise list', () => {
    expect(() => computeLogMetrics([], new Date('2026-08-13'), undefined, 62)).toThrow('No exercises');
  });

  it('derives the date from startedAt in local time (YYYY-MM-DD)', () => {
    const m = computeLogMetrics([pushups], new Date(2026, 7, 5, 23, 30), undefined, 62); // Aug 5 2026, 23:30 local
    expect(m.date).toBe('2026-08-05');
  });

  it('falls back to "now" when startedAt is null', () => {
    const before = new Date();
    const m = computeLogMetrics([pushups], null, undefined, 62);
    expect(m.date).toBe(
      `${before.getFullYear()}-${String(before.getMonth() + 1).padStart(2, '0')}-${String(before.getDate()).padStart(2, '0')}`
    );
  });

  it('derives intensity tier from total sets across all exercises (light < 6, moderate 6-11, heavy 12+)', () => {
    const light = computeLogMetrics([{ ...pushups, sets: 2 }], new Date(), undefined, 62); // 2 sets
    const moderate = computeLogMetrics([{ ...pushups, sets: 6 }], new Date(), undefined, 62); // 6 sets
    const heavy = computeLogMetrics([{ ...pushups, sets: 12 }], new Date(), undefined, 62); // 12 sets
    expect(light.intensity).toBe('light');
    expect(moderate.intensity).toBe('moderate');
    expect(heavy.intensity).toBe('heavy');
  });

  it('lets an explicit intensityOverride win over the derived tier', () => {
    const m = computeLogMetrics([{ ...pushups, sets: 2 }], new Date(), 'heavy', 62);
    expect(m.intensity).toBe('heavy');
  });

  it('sums per-exercise minutes and floors the total at 1', () => {
    const tiny = computeLogMetrics([{ ...pushups, sets: 1, reps: 1 }], new Date(), undefined, 62);
    expect(tiny.totalDurationMinutes).toBeGreaterThanOrEqual(1);

    const bigger = computeLogMetrics([pushups, dbCurl], new Date(), undefined, 62);
    const smaller = computeLogMetrics([pushups], new Date(), undefined, 62);
    expect(bigger.totalDurationMinutes).toBeGreaterThan(smaller.totalDurationMinutes);
  });

  it('produces a positive calorie estimate that scales with bodyweight', () => {
    const lighter = computeLogMetrics([dbCurl], new Date(), undefined, 50);
    const heavier = computeLogMetrics([dbCurl], new Date(), undefined, 90);
    expect(lighter.caloriesEstimate).toBeGreaterThan(0);
    expect(heavier.caloriesEstimate).toBeGreaterThan(lighter.caloriesEstimate);
  });

  it('strips undefined optional fields from each cleaned exercise (Firestore rejects `undefined`)', () => {
    const m = computeLogMetrics([pushups], new Date(), undefined, 62);
    const cleaned = m.exercises[0] as any;
    expect('durationSeconds' in cleaned).toBe(false);
    expect('weight' in cleaned).toBe(false);
    expect('distance' in cleaned).toBe(false);
    expect(cleaned.reps).toBe(20);
    expect(cleaned.sets).toBe(3);
  });

  it('defaults sets to 1 when undefined', () => {
    const { sets, ...rest } = pushups;
    const m = computeLogMetrics([rest as ExerciseEntry], new Date(), undefined, 62);
    expect(m.exercises[0].sets).toBe(1);
  });
});
