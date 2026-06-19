import { WorkoutLog, ExerciseEntry } from '../types/workout';
import { formatTime24 } from './format';

export interface TimelineItem {
  time: string | null;
  sortKey: number;
  name: string;
  ex: ExerciseEntry;
}

export function buildDayTimeline(logs: WorkoutLog[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const log of logs) {
    const ts = log.startedAt ?? log.createdAt;
    const time = formatTime24(ts ?? null);
    const sortKey = ts?.toMillis() ?? 0;
    for (const ex of log.exercises) {
      items.push({ time, sortKey, name: ex.name, ex });
    }
  }
  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

export function aggregateExercises(logs: WorkoutLog[]): ExerciseEntry[] {
  const map = new Map<string, ExerciseEntry>();
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (!map.has(ex.presetId)) {
        map.set(ex.presetId, { ...ex, sets: 1, reps: ex.reps ?? 0, durationSeconds: ex.durationSeconds ?? 0 });
      } else {
        const existing = map.get(ex.presetId)!;
        map.set(ex.presetId, {
          ...existing,
          reps: (existing.reps ?? 0) + (ex.reps ?? 0),
          durationSeconds: (existing.durationSeconds ?? 0) + (ex.durationSeconds ?? 0),
        });
      }
    }
  }
  return Array.from(map.values());
}
