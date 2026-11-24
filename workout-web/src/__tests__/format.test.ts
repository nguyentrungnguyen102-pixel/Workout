import { describe, it, expect } from 'vitest';
import { formatElapsedClock, formatAmountWithWeight } from '../lib/format';

describe('formatElapsedClock', () => {
  it('renders under an hour as M:SS', () => {
    expect(formatElapsedClock(0)).toBe('0:00');
    expect(formatElapsedClock(5)).toBe('0:05');
    expect(formatElapsedClock(65)).toBe('1:05');
    expect(formatElapsedClock(599)).toBe('9:59');
    expect(formatElapsedClock(3599)).toBe('59:59');
  });

  it('renders an hour or more as H:MM:SS', () => {
    expect(formatElapsedClock(3600)).toBe('1:00:00');
    expect(formatElapsedClock(3661)).toBe('1:01:01');
    expect(formatElapsedClock(7325)).toBe('2:02:05');
  });

  it('floors fractional seconds', () => {
    expect(formatElapsedClock(65.9)).toBe('1:05');
  });

  it('clamps negative input to 0 instead of a negative duration', () => {
    expect(formatElapsedClock(-42)).toBe('0:00');
  });
});

describe('formatAmountWithWeight', () => {
  it('appends kg when a weight was logged', () => {
    expect(formatAmountWithWeight({ unit: 'reps', reps: 12, weight: 6 })).toBe('12 cái · 6 kg');
  });
  it('leaves amount unchanged without weight', () => {
    expect(formatAmountWithWeight({ unit: 'reps', reps: 12 })).toBe('12 cái');
    expect(formatAmountWithWeight({ unit: 'reps', reps: 12, weight: 0 })).toBe('12 cái');
    expect(formatAmountWithWeight({ unit: 'minutes', durationSeconds: 600 })).toBe('10 phút');
  });
});
