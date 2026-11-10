import { describe, it, expect } from 'vitest';
import {
  findPreviousEntry, formatEntryShort, formatShortDate, compareWithPrevious,
  isValidRpe, rpeHint, copyEntryForRepeat,
} from '../lib/previousPerformance';
import { computeLogMetrics } from '../lib/logMetrics';
import { parseDraft, serializeDraft } from '../lib/draftPersistence';
import { ExerciseEntry, WorkoutLog } from '../types/workout';

const curl = (o: Partial<ExerciseEntry> = {}): ExerciseEntry => ({
  presetId: 'db_curl', name: 'Cuốn tạ', category: 'dumbbell', unit: 'reps', sets: 3, reps: 12, weight: 8, ...o,
});
const plank = (o: Partial<ExerciseEntry> = {}): ExerciseEntry => ({
  presetId: 'plank', name: 'Plank', category: 'core', unit: 'seconds', sets: 1, durationSeconds: 60, ...o,
});
const log = (id: string, date: string, exercises: ExerciseEntry[], extra: Partial<WorkoutLog> = {}): WorkoutLog => ({
  id, userId: 'u', date, exercises, totalDurationMinutes: 10, intensityScore: 5, intensity: 'moderate',
  caloriesEstimate: 50, source: 'manual', syncedToSheets: false, ...extra,
});
const ts = (seconds: number) => ({ seconds } as unknown as WorkoutLog['startedAt']);

describe('findPreviousEntry', () => {
  it('returns the most recent log containing the exercise, regardless of array order', () => {
    const logs = [
      log('b', '2026-11-08', [curl({ reps: 10 })]),
      log('a', '2026-11-01', [curl({ reps: 8 })]),
      log('c', '2026-11-09', [plank()]),
    ];
    const p = findPreviousEntry(logs, 'db_curl');
    expect(p?.date).toBe('2026-11-08');
    expect(p?.entry.reps).toBe(10);
  });

  it('breaks same-day ties by startedAt so the later session wins', () => {
    const logs = [
      log('late', '2026-11-08', [curl({ reps: 14 })], { startedAt: ts(2000) }),
      log('early', '2026-11-08', [curl({ reps: 9 })], { startedAt: ts(1000) }),
    ];
    expect(findPreviousEntry(logs, 'db_curl')?.entry.reps).toBe(14);
  });

  it('skips the log being edited and soft-deleted logs', () => {
    const logs = [
      log('old', '2026-11-01', [curl({ reps: 8 })]),
      log('editing', '2026-11-08', [curl({ reps: 10 })]),
      log('gone', '2026-11-09', [curl({ reps: 20 })], { deleted: true }),
    ];
    expect(findPreviousEntry(logs, 'db_curl', 'editing')?.entry.reps).toBe(8);
  });

  it('returns null when the exercise was never logged', () => {
    expect(findPreviousEntry([log('a', '2026-11-01', [plank()])], 'db_curl')).toBeNull();
    expect(findPreviousEntry([], 'db_curl')).toBeNull();
  });
});

describe('formatting', () => {
  it('formats sets, amount and weight compactly', () => {
    expect(formatEntryShort(curl())).toBe('3×12 cái · 8kg');
    expect(formatEntryShort(plank())).toBe('60 giây');
    expect(formatEntryShort(curl({ sets: 1, weight: undefined }))).toBe('12 cái');
  });

  it('formats short dates as dd/mm', () => {
    expect(formatShortDate('2026-11-05')).toBe('05/11');
    expect(formatShortDate('bad')).toBe('bad');
  });
});

describe('compareWithPrevious', () => {
  it('reports more reps as up', () => {
    expect(compareWithPrevious(curl({ reps: 14 }), curl())).toEqual({ direction: 'up', label: '+2 cái' });
  });

  it('heavier weight dominates slightly fewer reps', () => {
    const d = compareWithPrevious(curl({ weight: 10, reps: 10 }), curl());
    expect(d?.direction).toBe('up');
    expect(d?.label).toBe('+2kg, −2 cái');
  });

  it('lighter and fewer is down; identical is same', () => {
    expect(compareWithPrevious(curl({ weight: 6, reps: 10 }), curl())?.direction).toBe('down');
    expect(compareWithPrevious(curl(), curl())).toEqual({ direction: 'same', label: 'bằng lần trước' });
  });

  it('handles seconds, minutes and km units', () => {
    expect(compareWithPrevious(plank({ durationSeconds: 75 }), plank())?.label).toBe('+15 giây');
    const run = (km: number): ExerciseEntry => ({ presetId: 'run', name: 'Chạy', category: 'cardio', unit: 'km', sets: 1, distance: km });
    expect(compareWithPrevious(run(5.3), run(5))?.label).toBe('+0.3 km');
    const walk = (s: number): ExerciseEntry => ({ presetId: 'walk', name: 'Đi bộ', category: 'cardio', unit: 'minutes', sets: 1, durationSeconds: s });
    expect(compareWithPrevious(walk(1230), walk(1200))?.direction).toBe('same');
    expect(compareWithPrevious(walk(1500), walk(1200))?.label).toBe('+5 phút');
  });

  it('returns null while the draft value is still empty', () => {
    expect(compareWithPrevious(curl({ reps: 0 }), curl())).toBeNull();
  });
});

describe('RPE', () => {
  it('validates the 6–10 scale', () => {
    expect(isValidRpe(8)).toBe(true);
    expect(isValidRpe(5)).toBe(false);
    expect(isValidRpe(8.5)).toBe(false);
    expect(isValidRpe(undefined)).toBe(false);
  });

  it('suggests progression after an easy dumbbell session, holding after RPE 10', () => {
    expect(rpeHint(curl({ rpe: 7 }))).toMatch(/tăng tạ/);
    expect(rpeHint(curl({ rpe: 6, weight: undefined }))).toMatch(/thêm 2–3 cái/);
    expect(rpeHint(plank({ rpe: 6 }))).toMatch(/10 giây/);
    expect(rpeHint(curl({ rpe: 10 }))).toMatch(/giữ mức cũ/);
    expect(rpeHint(curl({ rpe: 8 }))).toBeNull();
    expect(rpeHint(curl())).toBeNull();
    expect(rpeHint(undefined)).toBeNull();
  });

  it('is persisted by computeLogMetrics and dropped when cleared', () => {
    const m = computeLogMetrics([curl({ rpe: 9 }), plank({ rpe: undefined })], new Date(2026, 10, 10), undefined, 70);
    expect(m.exercises[0].rpe).toBe(9);
    expect('rpe' in m.exercises[1]).toBe(false);
  });

  it('survives the localStorage draft round-trip', () => {
    const now = new Date(2026, 10, 10, 10);
    const raw = serializeDraft({ exercises: [curl({ rpe: 8 })], startedAt: now, intensity: 'moderate', notes: '', location: '' });
    expect(parseDraft(raw, now)?.exercises[0].rpe).toBe(8);
  });

  it('is not carried into a repeated session', () => {
    const src = curl({ rpe: 9 });
    const copy = copyEntryForRepeat(src);
    expect(copy.rpe).toBeUndefined();
    expect(copy.weight).toBe(8);
    expect(src.rpe).toBe(9); // original untouched
  });
});
