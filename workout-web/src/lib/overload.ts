import { ExerciseEntry, WorkoutLog } from '../types/workout';
import { daysBetween } from './date';

// Gợi ý tăng tiến (progressive overload) cho bài tạ đơn — kiểu "double
// progression" mà Hevy/Strong/JEFIT dùng: giữ nguyên mức tạ, tăng dần số rep
// đến trần; chạm trần thì tăng tạ và quay về sàn rep.
export const REP_FLOOR = 8;
export const REP_CEILING = 12;
// Quá ngần này ngày chưa tập lại bài đó → giữ nguyên để làm quen lại.
export const STALE_DAYS = 14;

export type OverloadKind = 'weight_up' | 'rep_up' | 'maintain';

export interface OverloadSuggestion {
  kind: OverloadKind;
  lastWeight: number;
  lastReps: number;
  weight: number;
  reps: number;
}

// Bước tăng tạ: tạ nhẹ tăng 1kg, từ 10kg trở lên tăng 2kg (tạ đơn thường
// theo bước 1-2kg; không có bước lẻ 0.5 để người dùng dễ chọn đúng quả tạ).
export function weightStep(weightKg: number): number {
  return weightKg < 10 ? 1 : 2;
}

export interface LastWeightedEntry {
  date: string;
  entry: ExerciseEntry;
}

// Lần gần nhất bài này có ghi cả tạ lẫn reps (bỏ qua log đã xoá mềm).
export function findLastWeightedEntry(logs: WorkoutLog[], presetId: string): LastWeightedEntry | undefined {
  let best: LastWeightedEntry | undefined;
  for (const log of logs) {
    if (log.deleted) continue;
    const entry = log.exercises?.find((e) => e.presetId === presetId && !!e.weight && !!e.reps);
    if (entry && (!best || log.date >= best.date)) best = { date: log.date, entry };
  }
  return best;
}

export function suggestOverload(last: LastWeightedEntry | undefined, today: string): OverloadSuggestion | null {
  const weight = last?.entry.weight;
  const reps = last?.entry.reps;
  if (!last || !weight || !reps || weight <= 0 || reps <= 0) return null;

  const base = { lastWeight: weight, lastReps: reps };
  if (daysBetween(last.date, today) > STALE_DAYS) {
    return { ...base, kind: 'maintain', weight, reps: Math.min(reps, REP_CEILING) };
  }
  if (reps >= REP_CEILING) {
    return { ...base, kind: 'weight_up', weight: weight + weightStep(weight), reps: REP_FLOOR };
  }
  return { ...base, kind: 'rep_up', weight, reps: Math.max(reps, REP_FLOOR - 1) + 1 };
}
