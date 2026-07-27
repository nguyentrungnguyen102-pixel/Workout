import { BodyMetric } from '../types/body';

export type BodyMetricKey = 'weight' | 'chestCm' | 'hipCm' | 'armCm';

export interface BodyMetricPoint {
  date: string;
  value: number;
}

/**
 * Builds a chronological (oldest → newest) series for one metric field,
 * for charting. `metrics` is expected sorted newest-first (as returned by
 * getBodyMetrics), so this takes the most recent `limit` entries that have
 * the field set, then reverses them to chart order.
 */
export function buildMetricSeries(
  metrics: BodyMetric[],
  key: BodyMetricKey,
  limit = 14
): BodyMetricPoint[] {
  return metrics
    .filter((m) => m[key] !== undefined)
    .slice(0, limit)
    .reverse()
    .map((m) => ({ date: m.date, value: m[key] as number }));
}
