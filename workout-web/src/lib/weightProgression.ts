// Gợi ý tăng tạ theo "double progression" — cách các app tập tạ top lượt tải
// (Strong, Hevy, Fitbod) dùng: giữ nguyên mức tạ cho tới khi đạt trần số reps
// ở nhiều buổi liên tiếp rồi mới tăng tạ và quay về reps thấp hơn.
import { WorkoutLog } from '../types/workout';

// Bước tăng tạ đơn tại nhà (quả tạ chỉnh được thường nhảy 1-2.5kg/quả).
export const WEIGHT_STEP_KG = 2.5;
// Trần reps để được gợi ý tăng, và số buổi liên tiếp phải đạt.
export const TOP_REPS = 12;
export const SESSIONS_REQUIRED = 2;

export interface WeightSession {
  date: string;
  weight: number;
  reps: number;
}

export interface WeightSuggestion {
  nextWeight: number;
  currentWeight: number;
  reason: string;
}

// Gom log thành các buổi (mới nhất trước) của 1 bài: mỗi ngày lấy set nặng
// nhất, cùng tạ thì reps cao nhất. Bỏ qua buổi không ghi tạ/reps.
export function sessionsForExercise(logs: WorkoutLog[], presetId: string): WeightSession[] {
  const byDate = new Map<string, WeightSession>();
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (ex.presetId !== presetId || !ex.weight || ex.weight <= 0 || !ex.reps) continue;
      const cur = byDate.get(log.date);
      if (!cur || ex.weight > cur.weight || (ex.weight === cur.weight && ex.reps > cur.reps)) {
        byDate.set(log.date, { date: log.date, weight: ex.weight, reps: ex.reps });
      }
    }
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function suggestNextWeight(logs: WorkoutLog[], presetId: string): WeightSuggestion | null {
  const sessions = sessionsForExercise(logs, presetId);
  if (sessions.length < SESSIONS_REQUIRED) return null;
  const recent = sessions.slice(0, SESSIONS_REQUIRED);
  const current = recent[0].weight;
  // Phải cùng 1 mức tạ và đều đạt trần reps ở mọi buổi gần nhất.
  if (!recent.every((s) => s.weight === current && s.reps >= TOP_REPS)) return null;
  return {
    currentWeight: current,
    nextWeight: Math.round((current + WEIGHT_STEP_KG) * 10) / 10,
    reason: `${SESSIONS_REQUIRED} buổi liên tiếp đạt ≥${TOP_REPS} reps với ${current}kg`,
  };
}
