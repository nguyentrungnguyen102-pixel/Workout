import { describe, it, expect } from 'vitest';
import { buildMetricSeries } from '../lib/bodyMetrics';
import { BodyMetric } from '../types/body';

function makeMetric(id: string, date: string, fields: Partial<BodyMetric> = {}): BodyMetric {
  return { id, userId: 'u1', date, ...fields };
}

describe('buildMetricSeries', () => {
  it('filters out entries missing the requested field', () => {
    const metrics = [
      makeMetric('3', '2026-07-20', { weight: 70 }),
      makeMetric('2', '2026-07-15', { chestCm: 90 }),
      makeMetric('1', '2026-07-10', { weight: 71 }),
    ];
    const series = buildMetricSeries(metrics, 'weight');
    expect(series.map((p) => p.date)).toEqual(['2026-07-10', '2026-07-20']);
  });

  it('reverses newest-first input into chronological (oldest→newest) order', () => {
    const metrics = [
      makeMetric('3', '2026-07-20', { weight: 72 }),
      makeMetric('2', '2026-07-15', { weight: 71 }),
      makeMetric('1', '2026-07-10', { weight: 70 }),
    ];
    const series = buildMetricSeries(metrics, 'weight');
    expect(series).toEqual([
      { date: '2026-07-10', value: 70 },
      { date: '2026-07-15', value: 71 },
      { date: '2026-07-20', value: 72 },
    ]);
  });

  it('respects the limit, keeping only the most recent entries', () => {
    const metrics = [
      makeMetric('4', '2026-07-25', { armCm: 33 }),
      makeMetric('3', '2026-07-20', { armCm: 32 }),
      makeMetric('2', '2026-07-15', { armCm: 31 }),
      makeMetric('1', '2026-07-10', { armCm: 30 }),
    ];
    const series = buildMetricSeries(metrics, 'armCm', 2);
    expect(series).toEqual([
      { date: '2026-07-20', value: 32 },
      { date: '2026-07-25', value: 33 },
    ]);
  });

  it('does not mutate the input array', () => {
    const metrics = [
      makeMetric('2', '2026-07-20', { hipCm: 95 }),
      makeMetric('1', '2026-07-10', { hipCm: 94 }),
    ];
    const copy = [...metrics];
    buildMetricSeries(metrics, 'hipCm');
    expect(metrics).toEqual(copy);
  });

  it('returns an empty array when no entries have the field', () => {
    const metrics = [makeMetric('1', '2026-07-10', { weight: 70 })];
    expect(buildMetricSeries(metrics, 'chestCm')).toEqual([]);
  });
});
