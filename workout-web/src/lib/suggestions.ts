import { WorkoutLog } from '../types/workout';
import { SYSTEM_PRESETS } from '../constants/exercises';

export interface Suggestion {
  presetId: string;
  name: string;
  unit: string;
  category: string;
  light: number;
  moderate: number;
  high: number;
  baseline: number;
}

function roundNice(value: number, unit: string): number {
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

export function buildSuggestions(logs: WorkoutLog[], max = 4, excludeIds?: Set<string>): Suggestion[] {
  // Filter logs from last 30 days. WorkoutLog.date is always a local-timezone
  // YYYY-MM-DD string, so the cutoff must be computed the same way (not via
  // toISOString, which is UTC and can shift the boundary by a day).
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const pad = (n: number) => String(n).padStart(2, '0');
  const cutoffStr = `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;

  const recentLogs = logs.filter((l) => l.date >= cutoffStr);

  // Group by presetId: frequency + best value
  const statsMap = new Map<string, { frequency: number; bestValue: number; name: string; unit: string; category: string }>();

  for (const log of recentLogs) {
    for (const ex of log.exercises) {
      const existing = statsMap.get(ex.presetId);
      let bestValue: number;
      if (ex.unit === 'reps') {
        bestValue = ex.reps ?? 0;
      } else if (ex.unit === 'km') {
        bestValue = ex.distance ?? 0;
      } else {
        bestValue = ex.durationSeconds ?? 0;
      }

      if (!existing) {
        statsMap.set(ex.presetId, {
          frequency: 1,
          bestValue,
          name: ex.name,
          unit: ex.unit,
          category: ex.category,
        });
      } else {
        statsMap.set(ex.presetId, {
          ...existing,
          frequency: existing.frequency + 1,
          bestValue: Math.max(existing.bestValue, bestValue),
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
    let baseline = stats.bestValue;
    if (baseline === 0 && preset) {
      if (preset.unit === 'minutes') {
        baseline = preset.defaultValue * 60;
      } else {
        baseline = preset.defaultValue;
      }
    }
    if (baseline === 0) continue;

    const light = roundNice(baseline * 0.9, stats.unit);
    const moderate = roundNice(baseline * 1.1, stats.unit);
    const high = roundNice(baseline * 1.2, stats.unit);

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

  return suggestions.slice(0, max);
}
