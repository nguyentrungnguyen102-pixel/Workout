import { ExerciseEntry, WorkoutLog } from '../types/workout';
import { formatAmount } from './format';

// "Lần trước" (Previous) column, the way Strong/Hevy show it next to every
// exercise while logging: what you did the last time you trained this
// exercise, plus a ▲/▼ delta against what's currently in the draft. Kept as
// pure functions so they're unit-testable without the store/Firestore.

export interface PreviousEntry {
  date: string;
  entry: ExerciseEntry;
}

// Most recent saved entry for `presetId`. `logs` may be in any order (the
// store keeps them ascending by date, but we don't rely on it); ties on date
// are broken by startedAt/createdAt seconds so two sessions on the same day
// resolve to the later one. `excludeLogId` skips the log currently being
// edited — otherwise "Lần trước" while editing a session would just echo
// that same session back at you.
export function findPreviousEntry(
  logs: WorkoutLog[],
  presetId: string,
  excludeLogId?: string | null,
): PreviousEntry | null {
  let best: { log: WorkoutLog; entry: ExerciseEntry; t: number } | null = null;
  for (const log of logs) {
    if (!log || log.deleted || (excludeLogId && log.id === excludeLogId)) continue;
    const entry = log.exercises?.find((e) => e.presetId === presetId);
    if (!entry) continue;
    const t = (log.startedAt?.seconds ?? log.createdAt?.seconds ?? 0);
    if (
      !best ||
      log.date > best.log.date ||
      (log.date === best.log.date && t > best.t)
    ) {
      best = { log, entry, t };
    }
  }
  return best ? { date: best.log.date, entry: best.entry } : null;
}

// "3×12 cái · 8kg" — sets prefix only when >1 (single-set logs read as
// noise with a "1×"), weight only when recorded.
export function formatEntryShort(e: ExerciseEntry): string {
  const sets = e.sets && e.sets > 1 ? `${e.sets}×` : '';
  const amount = `${sets}${formatAmount(e)}`;
  return e.weight && e.weight > 0 ? `${amount} · ${e.weight}kg` : amount;
}

// "2026-11-05" → "05/11"
export function formatShortDate(date: string): string {
  const [, m, d] = date.split('-');
  return m && d ? `${d}/${m}` : date;
}

export type DeltaDirection = 'up' | 'down' | 'same';

export interface PerformanceDelta {
  direction: DeltaDirection;
  label: string;
}

// Main measured value for the exercise's unit (reps / seconds / km).
function primaryValue(e: ExerciseEntry): number {
  if (e.unit === 'reps') return e.reps ?? 0;
  if (e.unit === 'seconds' || e.unit === 'minutes') return e.durationSeconds ?? 0;
  if (e.unit === 'km') return e.distance ?? 0;
  return 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function unitDeltaLabel(e: ExerciseEntry, diff: number): string {
  const sign = diff > 0 ? '+' : '−';
  const abs = Math.abs(diff);
  if (e.unit === 'reps') return `${sign}${abs} cái`;
  if (e.unit === 'seconds') return `${sign}${abs} giây`;
  if (e.unit === 'minutes') return `${sign}${Math.round(abs / 60)} phút`;
  if (e.unit === 'km') return `${sign}${round1(abs)} km`;
  return `${sign}${abs}`;
}

// Compare the current draft entry with the previous one. Weight is compared
// first for dumbbell work (heavier at the same reps is the progression that
// matters for home dumbbell training), then the unit's main value. Returns
// null when there's nothing meaningful to compare (draft value still 0).
export function compareWithPrevious(current: ExerciseEntry, previous: ExerciseEntry): PerformanceDelta | null {
  const cur = primaryValue(current);
  if (cur <= 0) return null;
  const prev = primaryValue(previous);

  const parts: string[] = [];
  let score = 0;

  const cw = current.weight ?? 0;
  const pw = previous.weight ?? 0;
  if (cw > 0 && pw > 0 && cw !== pw) {
    const d = round1(cw - pw);
    parts.push(`${d > 0 ? '+' : '−'}${Math.abs(d)}kg`);
    score += d > 0 ? 2 : -2;
  }

  const diff = cur - prev;
  // minutes are stored as seconds; ignore sub-minute noise for that unit.
  const meaningful = current.unit === 'minutes' ? Math.abs(diff) >= 60 : Math.abs(diff) > 1e-9;
  if (meaningful) {
    parts.push(unitDeltaLabel(current, diff));
    score += diff > 0 ? 1 : -1;
  }

  if (parts.length === 0) return { direction: 'same', label: 'bằng lần trước' };
  // Weight dominates: heavier with slightly fewer reps still counts as up.
  const direction: DeltaDirection = score > 0 ? 'up' : score < 0 ? 'down' : 'same';
  return { direction, label: parts.join(', ') };
}

// ── RPE (Rate of Perceived Exertion) ────────────────────────────────────────
// Simplified 6–10 scale (as in Hevy/Strong's RPE picker), with the matching
// "reps in reserve" reading most home lifters find easier to judge.

export const RPE_VALUES = [6, 7, 8, 9, 10] as const;
export type RpeValue = (typeof RPE_VALUES)[number];

export const RPE_LABELS: Record<RpeValue, { short: string; long: string }> = {
  6: { short: 'Nhẹ', long: 'Nhẹ — còn dư 4+ cái' },
  7: { short: 'Vừa', long: 'Vừa — còn dư 3 cái' },
  8: { short: 'Khó', long: 'Khó — còn dư 2 cái' },
  9: { short: 'Rất khó', long: 'Rất khó — còn dư 1 cái' },
  10: { short: 'Kiệt sức', long: 'Kiệt sức — không thể thêm cái nào' },
};

export function isValidRpe(v: unknown): v is RpeValue {
  return typeof v === 'number' && (RPE_VALUES as readonly number[]).includes(v);
}

// Next-session nudge based on how hard the previous session of this
// exercise felt. Only for exercises where adding load/reps makes sense.
export function rpeHint(previous: ExerciseEntry | undefined): string | null {
  if (!previous || !isValidRpe(previous.rpe)) return null;
  const rpe = previous.rpe;
  const isDumbbell = previous.category === 'dumbbell' && (previous.weight ?? 0) > 0;
  if (rpe <= 7) {
    if (isDumbbell) return 'Lần trước còn dư sức — thử tăng tạ 1–2kg hoặc thêm 2 cái.';
    if (previous.unit === 'reps') return 'Lần trước còn dư sức — thử thêm 2–3 cái.';
    if (previous.unit === 'seconds') return 'Lần trước còn dư sức — thử giữ thêm 10 giây.';
    return 'Lần trước còn dư sức — có thể tăng nhẹ hôm nay.';
  }
  if (rpe === 10) return 'Lần trước đã kiệt sức — giữ mức cũ, tập đúng kỹ thuật trước.';
  return null;
}

// RPE describes how ONE session felt — when a past session is copied into a
// fresh draft ("Tập lại"), it must not carry over, or the new session would
// silently be saved with last time's exertion rating.
export function copyEntryForRepeat(e: ExerciseEntry): ExerciseEntry {
  const copy: ExerciseEntry = { ...e };
  delete copy.rpe;
  return copy;
}
