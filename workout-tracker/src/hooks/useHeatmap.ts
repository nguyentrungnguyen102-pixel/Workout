import { useState, useEffect } from 'react';
import { WorkoutLog, Intensity } from '../types/workout';
import { getLogsForHeatmap } from '../services/workoutService';
import { getLast90Days } from '../lib/date';

export interface HeatmapCell {
  date: string;
  intensity: Intensity | null;
  intensityScore: number;
}

export function useHeatmap(uid?: string) {
  const [data, setData] = useState<Record<string, HeatmapCell>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getLogsForHeatmap(uid, getLast90Days())
      .then((logs) => {
        // Multiple logs per day: keep the highest intensity for each day
        const map: Record<string, HeatmapCell> = {};
        logs.forEach((log) => {
          const existing = map[log.date];
          if (!existing || log.intensityScore > existing.intensityScore) {
            map[log.date] = {
              date: log.date,
              intensity: log.intensity,
              intensityScore: log.intensityScore,
            };
          }
        });
        setData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  return { data, loading };
}
