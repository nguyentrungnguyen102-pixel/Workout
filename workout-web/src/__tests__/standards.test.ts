import { describe, it, expect } from 'vitest';
import { bmiStandard, strengthStandard, scaleMarkerPercent, Band } from '../lib/standards';

describe('bmiStandard', () => {
  it('60kg/170cm scores in the Bình thường (normal) band', () => {
    const std = bmiStandard(60, 170);
    expect(std.value).toBeCloseTo(20.8, 1);
    expect(std.bands[std.tierIndex].label).toBe('Bình thường');
  });

  it('75kg/170cm scores Béo phì under the Asian BMI cutoff (NOT normal)', () => {
    const std = bmiStandard(75, 170);
    // Asian cutoff for Béo phì is >=25 kg/m^2 (lower than the WHO global 30
    // cutoff) — a naive "normal up to 25" reading would wrongly call this
    // normal, so the exact regression to guard is the tier label, not the
    // rounded value (~25.9-26.0 depending on rounding).
    expect(std.value).toBeGreaterThan(25);
    expect(std.value).toBeLessThan(27);
    expect(std.bands[std.tierIndex].label).toBe('Béo phì');
  });
});

describe('strengthStandard', () => {
  it('pushup 30 reps, male, age 35 scores a sensible mid-or-better tier', () => {
    const std = strengthStandard('pushup', 30, 'male', 35);
    expect(std).not.toBeNull();
    expect(std!.tierIndex).toBeGreaterThanOrEqual(1);
  });

  it('returns null for an exercise with no published norm table', () => {
    const std = strengthStandard('unknown', 10, 'male', 30);
    expect(std).toBeNull();
  });
});

describe('scaleMarkerPercent', () => {
  const whoBands: Band[] = [
    { label: 'Dưới chuẩn', min: 0 },
    { label: 'Đạt chuẩn', min: 150 },
    { label: 'Tối ưu', min: 300 },
  ];

  it('places the marker at the start of the 2nd of 3 equal segments at the 2nd threshold', () => {
    expect(scaleMarkerPercent(whoBands, 150)).toBeCloseTo(100 / 3, 1);
  });

  it('returns 0 at the very bottom of the scale', () => {
    expect(scaleMarkerPercent(whoBands, 0)).toBe(0);
  });

  it('lands within the last segment for the top threshold', () => {
    const pct = scaleMarkerPercent(whoBands, 300);
    expect(pct).toBeGreaterThanOrEqual(200 / 3);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('is always within [0, 100] and monotonic non-decreasing across increasing values', () => {
    const values = [-50, 0, 50, 100, 150, 200, 250, 300, 350, 500];
    let prev = -Infinity;
    for (const v of values) {
      const pct = scaleMarkerPercent(whoBands, v);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
      expect(pct).toBeGreaterThanOrEqual(prev);
      prev = pct;
    }
  });
});
