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

export function buildSuggestions(logs: WorkoutLog[], max = 4): Suggestion[] {
  // Filter logs from last 30 days
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentLogs = logs.filter((l) => l.date >= cutoffStr);

  // Group by presetId: frequency + best value
  const statsMap = new Map<string, { frequency: number; bestValue: number; name: string; unit: string; category: string }>();

  for (const log of recentLogs) {
    for (const ex of log.exercises) {
      const existing = statsMap.get(ex.presetId);
      let bestValue: number;
      if (ex.unit === 'reps') {
        bestValue = ex.reps ?? 0;
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
