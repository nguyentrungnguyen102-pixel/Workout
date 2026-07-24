// Ước tính 1RM (mức tạ nâng tối đa 1 lần) bằng công thức Epley — chuẩn dùng
// phổ biến ở các app tập tạ top lượt tải (Strong, Hevy, ...). Đáng tin cậy
// nhất trong khoảng 1-10 reps; trên đó vẫn tính nhưng chỉ mang tính ước lượng.
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export interface OneRepMaxEntry {
  date: string;
  weight?: number;
  reps?: number;
}

export interface BestOneRepMax {
  date: string;
  oneRepMax: number;
  weight: number;
  reps: number;
}

// Quét toàn bộ log của 1 bài tập, trả về set tạ×reps cho 1RM ước tính cao
// nhất (không phải set có tạ nặng nhất — vd 10kg×10 reps có thể cho 1RM ước
// tính cao hơn 12kg×3 reps).
export function bestOneRepMax(entries: OneRepMaxEntry[]): BestOneRepMax | null {
  let best: BestOneRepMax | null = null;
  for (const entry of entries) {
    if (!entry.weight || !entry.reps) continue;
    const oneRepMax = estimateOneRepMax(entry.weight, entry.reps);
    if (oneRepMax > 0 && (!best || oneRepMax > best.oneRepMax)) {
      best = { date: entry.date, oneRepMax, weight: entry.weight, reps: entry.reps };
    }
  }
  return best;
}
