import { WorkoutLog } from '../types/workout';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { daysAgoString } from './date';

export interface Suggestion {
  presetId: string;
  name: string;
  unit: string;
  category: string;
  light: number;
  moderate: number;
  high: number;
  baseline: number;
  isNew?: boolean;
}

export function roundNice(value: number, unit: string): number {
  if (unit === 'reps') {
    const rounded = Math.round(value / 5) * 5;
    return Math.max(1, rounded);
  }
  if (unit === 'seconds') {
    return Math.max(5, Math.round(value / 5) * 5);
  }
  if (unit === 'minutes') {
    // stored as seconds, round to nearest 60
    return Math.max(60, Math.round(value / 60) * 60);
  }
  return Math.max(1, Math.round(value));
}

// Rounding step per unit — also the minimum gap enforced between light/moderate/high
// below, since ±10%/+20% of a small baseline can round to the same nice number.
function stepFor(unit: string): number {
  if (unit === 'reps' || unit === 'seconds') return 5;
  if (unit === 'minutes') return 60;
  return 1;
}

export function buildSuggestions(logs: WorkoutLog[], max = 5, excludeIds?: Set<string>): Suggestion[] {
  // Filter logs from last 30 days. Uses the app's shared local-date helper
  // (not toISOString, which is UTC) to stay consistent with how
  // WorkoutLog.date is built everywhere else — otherwise the cutoff is off
  // by a day for timezones ahead of UTC during local early-morning hours.
  const cutoffStr = daysAgoString(30);

  const recentLogs = logs.filter((l) => l.date >= cutoffStr);

  // Group by presetId: frequency + best value + most recent value
  const statsMap = new Map<string, { frequency: number; bestValue: number; lastValue: number; lastDate: string; name: string; unit: string; category: string }>();

  for (const log of recentLogs) {
    for (const ex of log.exercises) {
      const existing = statsMap.get(ex.presetId);
      let value: number;
      if (ex.unit === 'reps') {
        value = ex.reps ?? 0;
      } else if (ex.unit === 'km') {
        value = ex.distance ?? 0;
      } else {
        value = ex.durationSeconds ?? 0;
      }

      if (!existing) {
        statsMap.set(ex.presetId, {
          frequency: 1,
          bestValue: value,
          lastValue: value,
          lastDate: log.date,
          name: ex.name,
          unit: ex.unit,
          category: ex.category,
        });
      } else {
        // "Most recent" is decided by log.date (string compare, YYYY-MM-DD sorts
        // correctly); ties (same day, multiple sessions) keep whichever was
        // encountered later in `recentLogs`, which is acceptable without
        // createdAt millis on hand here.
        const isNewer = log.date >= existing.lastDate;
        statsMap.set(ex.presetId, {
          ...existing,
          frequency: existing.frequency + 1,
          bestValue: Math.max(existing.bestValue, value),
          lastValue: isNewer ? value : existing.lastValue,
          lastDate: isNewer ? log.date : existing.lastDate,
        });
      }
    }
  }

  // Build suggestions
  const suggestions: Suggestion[] = [];

  for (const [presetId, stats] of statsMap.entries()) {
    // Skip exercises that are already goals or already done today — suggestions
    // should be complementary "what to do next", not a repeat of the goals.
    if (excludeIds?.has(presetId)) continue;
    // Fallback baseline from SYSTEM_PRESETS
    const preset = SYSTEM_PRESETS.find((p) => p.id === presetId);
    let baseline = stats.lastValue || stats.bestValue;
    if (baseline === 0 && preset) {
      if (preset.unit === 'minutes') {
        baseline = preset.defaultValue * 60;
      } else {
        baseline = preset.defaultValue;
      }
    }
    if (baseline === 0) continue;

    // Progressive model: anchor on the user's CURRENT level (baseline) and
    // grow from there, rather than a fixed ±% of the 30-day max — so the
    // suggestion keeps climbing as the user's level climbs instead of
    // plateauing at "0.9x/1.1x/1.2x of my best ever".
    const step = stepFor(stats.unit);
    const inc = Math.max(step, roundNice(baseline * 0.1, stats.unit));
    const light = roundNice(baseline, stats.unit);              // duy trì mức hiện tại
    let moderate = roundNice(baseline + inc, stats.unit);       // tăng nhẹ
    let high = roundNice(baseline + 2 * inc, stats.unit);       // thử thách
    // Guarantee visibly distinct light/moderate/high buttons — rounding alone
    // collapses these for common small baselines (e.g. baseline=10 or 12).
    if (moderate <= light) moderate = light + step;
    if (high <= moderate) high = moderate + step;

    suggestions.push({
      presetId,
      name: stats.name,
      unit: stats.unit,
      category: stats.category,
      light,
      moderate,
      high,
      baseline,
    });
  }

  // Sort by frequency descending, take top max
  suggestions.sort((a, b) => {
    const fa = statsMap.get(a.presetId)?.frequency ?? 0;
    const fb = statsMap.get(b.presetId)?.frequency ?? 0;
    return fb - fa;
  });

  const result = suggestions.slice(0, max);

  // "Thử mới" — if there's still room, fill up to 2 extra slots with system
  // presets from the user's most-trained category (by recentLogs) that they
  // haven't done in the last 30 days and that aren't already excluded.
  if (result.length < max) {
    const categoryCounts = new Map<string, number>();
    for (const log of recentLogs) {
      for (const ex of log.exercises) {
        categoryCounts.set(ex.category, (categoryCounts.get(ex.category) ?? 0) + 1);
      }
    }
    let topCategory: string | undefined;
    let topCount = 0;
    for (const [category, count] of categoryCounts.entries()) {
      if (count > topCount) {
        topCount = count;
        topCategory = category;
      }
    }

    if (topCategory) {
      const slotsLeft = Math.min(2, max - result.length);
      const candidates = SYSTEM_PRESETS.filter(
        (p) => p.category === topCategory && !statsMap.has(p.id) && !excludeIds?.has(p.id)
      ).slice(0, slotsLeft);

      for (const preset of candidates) {
        const baseline = preset.unit === 'minutes' ? preset.defaultValue * 60 : preset.defaultValue;
        const step = stepFor(preset.unit);
        const light = roundNice(baseline * 0.75, preset.unit);
        let moderate = baseline;
        let high = roundNice(baseline * 1.25, preset.unit);
        if (moderate <= light) moderate = light + step;
        if (high <= moderate) high = moderate + step;

        result.push({
          presetId: preset.id,
          name: preset.nameVi,
          unit: preset.unit,
          category: preset.category,
          light,
          moderate,
          high,
          baseline,
          isNew: true,
        });
      }
    }
  }

  return result;
}
