// Gợi ý mức tạ theo số reps mục tiêu (đảo công thức Epley của oneRepMax.ts) và
// các hiệp khởi động — tính năng quen thuộc ở app tập tạ top lượt tải (Strong,
// Hevy, Fitbod). Làm tròn theo bước 0.5kg cho phù hợp tạ đơn tại nhà.
export const TARGET_REPS = [5, 8, 10, 12, 15] as const;

export function roundToStep(kg: number, step = 0.5): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  return Math.round(kg / step) * step;
}

// weight = 1RM / (1 + reps/30); reps = 1 thì chính là 1RM.
export function weightForReps(oneRepMax: number, reps: number): number {
  if (!oneRepMax || oneRepMax <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return roundToStep(oneRepMax);
  return roundToStep(oneRepMax / (1 + reps / 30));
}

export interface LoadSuggestion {
  reps: number;
  weight: number;
}

export function loadTable(oneRepMax: number, repsList: readonly number[] = TARGET_REPS): LoadSuggestion[] {
  return repsList
    .map((reps) => ({ reps, weight: weightForReps(oneRepMax, reps) }))
    .filter((s) => s.weight > 0);
}

export interface WarmupSet {
  weight: number;
  reps: number;
}

// 3 hiệp khởi động tăng dần (50% × 8, 70% × 5, 85% × 3). Bỏ hiệp trùng mức tạ
// (tạ nhẹ làm tròn ra cùng giá trị) hoặc không nhẹ hơn tạ làm việc.
export function warmupSets(workingWeight: number): WarmupSet[] {
  if (!workingWeight || workingWeight <= 0) return [];
  const plan = [
    { pct: 0.5, reps: 8 },
    { pct: 0.7, reps: 5 },
    { pct: 0.85, reps: 3 },
  ];
  const out: WarmupSet[] = [];
  for (const { pct, reps } of plan) {
    const weight = roundToStep(workingWeight * pct);
    if (weight <= 0 || weight >= workingWeight) continue;
    if (out.length && out[out.length - 1].weight === weight) continue;
    out.push({ weight, reps });
  }
  return out;
}
