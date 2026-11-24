// "Bộ tạ tại nhà" — the dumbbell weights the user actually owns.
//
// Equipment-aware apps (Fitbod, JEFIT, Hevy's "available weights") only ever
// suggest loads you can physically pick up. Home lifters rarely own a full
// rack: typically a fixed pair or two (e.g. 2/4/6 kg) or an adjustable set
// that moves in 2–2.5 kg steps. Storing that list on the profile lets the
// QuickAdd weight chips show real options instead of a generic 2.5…15 row,
// and lets us say "next step up is 8 kg" instead of "add 2.5 kg".
//
// All functions are pure so they can be unit-tested without Firebase.

/** Fallback chips when the user hasn't configured a set (old behaviour). */
export const DEFAULT_DUMBBELL_CHIPS = [2.5, 5, 7.5, 10, 12.5, 15];

/** Cap on how many weights a set can hold — keeps the profile doc small. */
export const MAX_DUMBBELL_WEIGHTS = 40;

/** Max chips rendered in one row on the logging screen. */
export const MAX_VISIBLE_CHIPS = 7;

export interface DumbbellSetPreset {
  id: string;
  label: string;
  hint: string;
  weights: number[];
}

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  // Integer loop avoids float drift (0.1 + 0.2 style) on 2.5-kg steps.
  const n = Math.round((to - from) / step);
  for (let i = 0; i <= n; i++) out.push(Math.round((from + i * step) * 100) / 100);
  return out;
}

export const DUMBBELL_SET_PRESETS: DumbbellSetPreset[] = [
  { id: 'fixed-basic', label: 'Tạ cố định cơ bản', hint: '2 · 4 · 6 kg', weights: [2, 4, 6] },
  { id: 'fixed-plus', label: 'Tạ cố định mở rộng', hint: '2 → 10 kg (bước 2)', weights: [2, 4, 6, 8, 10] },
  { id: 'adjustable-20', label: 'Tạ điều chỉnh 20 kg', hint: '2.5 → 20 kg (bước 2.5)', weights: range(2.5, 20, 2.5) },
  { id: 'adjustable-24', label: 'Tạ điều chỉnh 24 kg', hint: '2 → 24 kg (bước 2)', weights: range(2, 24, 2) },
];

/** Grid of common weights offered as toggles in Settings. */
export const COMMON_DUMBBELL_WEIGHTS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 10, 12, 12.5, 14, 15, 16, 17.5, 18, 20, 22, 22.5, 24, 25, 30];

/**
 * Clean any input list: drop non-finite / non-positive / absurd (>100 kg)
 * values, round to 0.25 kg, dedupe, sort ascending, cap length.
 */
export function normalizeDumbbellWeights(input: readonly unknown[] | undefined | null): number[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<number>();
  for (const raw of input) {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : NaN;
    if (!Number.isFinite(n) || n <= 0 || n > 100) continue;
    set.add(Math.round(n * 4) / 4);
  }
  return Array.from(set).sort((a, b) => a - b).slice(0, MAX_DUMBBELL_WEIGHTS);
}

/**
 * Parse free text like "2, 4; 6.5 8kg" or "7,5" (Vietnamese decimal comma
 * when it's the only number) into a normalized list.
 */
export function parseDumbbellWeightsText(text: string): number[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  // A lone "7,5" is a decimal comma, not a list of 7 and 5.
  if (/^\d+,\d+\s*(kg)?$/i.test(trimmed)) return normalizeDumbbellWeights([trimmed.replace(/kg/i, '')]);
  const tokens = trimmed.split(/[\s,;/]+|kg/i).filter(Boolean);
  return normalizeDumbbellWeights(tokens);
}

/** Toggle one weight in/out of the set, returning a new normalized list. */
export function toggleDumbbellWeight(current: readonly number[] | undefined, weight: number): number[] {
  const list = normalizeDumbbellWeights(current ?? []);
  const w = Math.round(weight * 4) / 4;
  return list.includes(w) ? list.filter((x) => x !== w) : normalizeDumbbellWeights([...list, w]);
}

/** Compact label like "2 · 4 · 6 kg" (or "2 → 20 kg · 8 mức" for long sets). */
export function formatDumbbellSet(weights: readonly number[] | undefined): string {
  const list = normalizeDumbbellWeights(weights ?? []);
  if (list.length === 0) return 'Chưa khai báo';
  if (list.length <= 6) return `${list.join(' · ')} kg`;
  return `${list[0]} → ${list[list.length - 1]} kg · ${list.length} mức`;
}

/**
 * Weight chips for the logging screen. With no configured set → the generic
 * default row. With a set ≤ MAX_VISIBLE_CHIPS → all of it. With a bigger set
 * → a window of MAX_VISIBLE_CHIPS centred on the current weight (or the
 * lightest weights when none is entered yet) so the row never wraps 3 lines.
 */
export function weightChipsFor(available: readonly number[] | undefined, current?: number): number[] {
  const list = normalizeDumbbellWeights(available ?? []);
  if (list.length === 0) return DEFAULT_DUMBBELL_CHIPS;
  if (list.length <= MAX_VISIBLE_CHIPS) return list;
  let center = 0;
  if (current !== undefined && current > 0) {
    let best = Infinity;
    list.forEach((w, i) => {
      const d = Math.abs(w - current);
      if (d < best) { best = d; center = i; }
    });
  }
  let start = Math.max(0, center - Math.floor(MAX_VISIBLE_CHIPS / 2));
  start = Math.min(start, list.length - MAX_VISIBLE_CHIPS);
  return list.slice(start, start + MAX_VISIBLE_CHIPS);
}

/** Next heavier weight the user owns, or null when already at the top. */
export function nextHeavierWeight(available: readonly number[] | undefined, current: number): number | null {
  const list = normalizeDumbbellWeights(available ?? []);
  return list.find((w) => w > current + 1e-9) ?? null;
}

/** Next lighter weight the user owns, or null when already at the bottom. */
export function nextLighterWeight(available: readonly number[] | undefined, current: number): number | null {
  const list = normalizeDumbbellWeights(available ?? []);
  for (let i = list.length - 1; i >= 0; i--) if (list[i] < current - 1e-9) return list[i];
  return null;
}

/** True when the weight is not part of the user's configured set. */
export function isOffSetWeight(available: readonly number[] | undefined, weight: number | undefined): boolean {
  const list = normalizeDumbbellWeights(available ?? []);
  if (list.length === 0 || weight === undefined || weight <= 0) return false;
  return !list.includes(Math.round(weight * 4) / 4);
}
