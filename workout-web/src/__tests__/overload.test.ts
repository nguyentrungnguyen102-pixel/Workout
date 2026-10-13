import { describe, it, expect } from 'vitest';
import { suggestOverload, findLastWeightedEntry, weightStep } from '../lib/overload';
import { WorkoutLog } from '../types/workout';

const log = (date: string, weight?: number, reps?: number, deleted = false): WorkoutLog =>
  ({
    id: date, userId: 'u', date, deleted,
    exercises: [{ presetId: 'db_bicep_curl', name: 'x', category: 'dumbbell', unit: 'reps', sets: 3, weight, reps }],
  } as unknown as WorkoutLog);

describe('weightStep', () => {
  it('1kg dưới 10kg, 2kg từ 10kg', () => {
    expect(weightStep(5)).toBe(1);
    expect(weightStep(9.5)).toBe(1);
    expect(weightStep(10)).toBe(2);
  });
});

describe('suggestOverload', () => {
  const mk = (weight: number, reps: number, date = '2026-10-10') => findLastWeightedEntry([log(date, weight, reps)], 'db_bicep_curl');

  it('tăng 1 rep khi chưa chạm trần', () => {
    expect(suggestOverload(mk(10, 10), '2026-10-13')).toMatchObject({ kind: 'rep_up', weight: 10, reps: 11 });
  });
  it('rep thấp hơn sàn thì nâng lên sàn', () => {
    expect(suggestOverload(mk(10, 5), '2026-10-13')).toMatchObject({ kind: 'rep_up', reps: 8 });
  });
  it('chạm trần 12 rep thì tăng tạ và về sàn rep', () => {
    expect(suggestOverload(mk(10, 12), '2026-10-13')).toMatchObject({ kind: 'weight_up', weight: 12, reps: 8 });
    expect(suggestOverload(mk(6, 14), '2026-10-13')).toMatchObject({ kind: 'weight_up', weight: 7, reps: 8 });
  });
  it('nghỉ quá 14 ngày thì giữ nguyên', () => {
    expect(suggestOverload(mk(10, 12, '2026-09-01'), '2026-10-13')).toMatchObject({ kind: 'maintain', weight: 10, reps: 12 });
  });
  it('không có dữ liệu tạ/reps thì null', () => {
    expect(suggestOverload(undefined, '2026-10-13')).toBeNull();
    expect(findLastWeightedEntry([log('2026-10-10', undefined, 10)], 'db_bicep_curl')).toBeUndefined();
  });
});

describe('findLastWeightedEntry', () => {
  it('lấy log mới nhất, bỏ log đã xoá', () => {
    const r = findLastWeightedEntry([log('2026-10-01', 8, 10), log('2026-10-05', 10, 10), log('2026-10-09', 14, 10, true)], 'db_bicep_curl');
    expect(r?.date).toBe('2026-10-05');
    expect(r?.entry.weight).toBe(10);
  });
});
