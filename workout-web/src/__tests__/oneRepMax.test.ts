import { describe, it, expect } from 'vitest';
import { estimateOneRepMax, bestOneRepMax } from '../lib/oneRepMax';

describe('estimateOneRepMax (Epley)', () => {
  it('computes weight × (1 + reps/30) rounded to 1 decimal', () => {
    expect(estimateOneRepMax(10, 10)).toBeCloseTo(13.3, 1);
    expect(estimateOneRepMax(20, 5)).toBeCloseTo(23.3, 1);
  });

  it('returns the weight itself at 1 rep', () => {
    expect(estimateOneRepMax(15, 1)).toBe(15);
  });

  it('returns 0 for missing or non-positive inputs', () => {
    expect(estimateOneRepMax(0, 10)).toBe(0);
    expect(estimateOneRepMax(10, 0)).toBe(0);
    expect(estimateOneRepMax(-5, 10)).toBe(0);
    expect(estimateOneRepMax(10, -3)).toBe(0);
  });
});

describe('bestOneRepMax', () => {
  it('picks the entry with the highest estimated 1RM, not the heaviest weight', () => {
    // 12kg×3 → 13.2 estimated; 10kg×10 → 13.3 estimated — the higher-rep set wins.
    const entries = [
      { date: '2026-07-01', weight: 12, reps: 3 },
      { date: '2026-07-10', weight: 10, reps: 10 },
    ];
    const best = bestOneRepMax(entries);
    expect(best?.date).toBe('2026-07-10');
    expect(best?.weight).toBe(10);
    expect(best?.reps).toBe(10);
    expect(best?.oneRepMax).toBeCloseTo(13.3, 1);
  });

  it('ignores entries missing weight or reps', () => {
    const entries = [
      { date: '2026-07-01', reps: 10 },
      { date: '2026-07-02', weight: 10 },
      { date: '2026-07-03', weight: 12, reps: 8 },
    ];
    const best = bestOneRepMax(entries);
    expect(best?.date).toBe('2026-07-03');
  });

  it('returns null when no entry has both weight and reps', () => {
    expect(bestOneRepMax([{ date: '2026-07-01', reps: 10 }])).toBeNull();
    expect(bestOneRepMax([])).toBeNull();
  });
});
