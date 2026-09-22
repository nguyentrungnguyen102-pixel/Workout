import { describe, it, expect } from 'vitest';
import {
  REST_PRESETS_SECONDS,
  REST_MIN_SECONDS,
  REST_MAX_SECONDS,
  clampRestSeconds,
  computeRemainingSeconds,
  addSecondsToEnd,
} from '../lib/restTimer';

describe('restTimer', () => {
  it('exposes the standard Strong/Hevy-style rest presets', () => {
    expect(REST_PRESETS_SECONDS).toEqual([30, 60, 90, 120]);
  });

  describe('clampRestSeconds', () => {
    it('keeps values within range unchanged (rounded)', () => {
      expect(clampRestSeconds(45)).toBe(45);
      expect(clampRestSeconds(45.6)).toBe(46);
    });

    it('clamps below the minimum', () => {
      expect(clampRestSeconds(0)).toBe(REST_MIN_SECONDS);
      expect(clampRestSeconds(-10)).toBe(REST_MIN_SECONDS);
    });

    it('clamps above the maximum', () => {
      expect(clampRestSeconds(9999)).toBe(REST_MAX_SECONDS);
    });

    it('falls back to the first preset for non-finite input', () => {
      expect(clampRestSeconds(NaN)).toBe(REST_PRESETS_SECONDS[0]);
      expect(clampRestSeconds(Infinity)).toBe(REST_PRESETS_SECONDS[0]);
    });
  });

  describe('computeRemainingSeconds', () => {
    it('computes whole seconds left until endAt, rounding up', () => {
      const now = 1_000_000;
      expect(computeRemainingSeconds(now + 30_000, now)).toBe(30);
      expect(computeRemainingSeconds(now + 30_400, now)).toBe(31);
    });

    it('never returns negative — countdown stops at 0 once past due', () => {
      const now = 1_000_000;
      expect(computeRemainingSeconds(now - 5_000, now)).toBe(0);
    });
  });

  describe('addSecondsToEnd', () => {
    it('extends the end timestamp by the given seconds', () => {
      const now = 1_000_000;
      const endAt = now + 20_000; // 20s left
      const next = addSecondsToEnd(endAt, 15, now);
      expect(computeRemainingSeconds(next, now)).toBe(35);
    });

    it('clamps the resulting remaining time to the max', () => {
      const now = 1_000_000;
      const endAt = now + REST_MAX_SECONDS * 1000 - 5_000; // 5s under max
      const next = addSecondsToEnd(endAt, 60, now);
      expect(computeRemainingSeconds(next, now)).toBe(REST_MAX_SECONDS);
    });

    it('never adds below the minimum even with a large negative delta', () => {
      const now = 1_000_000;
      const endAt = now + 10_000; // 10s left
      const next = addSecondsToEnd(endAt, -100, now);
      expect(computeRemainingSeconds(next, now)).toBe(REST_MIN_SECONDS);
    });
  });
});
