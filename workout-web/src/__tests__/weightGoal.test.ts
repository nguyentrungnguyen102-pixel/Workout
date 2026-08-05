import { describe, it, expect } from 'vitest';
import { computeWeightGoalProgress } from '../lib/weightGoal';

describe('computeWeightGoalProgress', () => {
  it('tracks progress toward a lower goal (losing weight)', () => {
    const p = computeWeightGoalProgress(80, 75, 70);
    expect(p).not.toBeNull();
    expect(p!.direction).toBe('lose');
    expect(p!.progressPct).toBe(50);
    expect(p!.remainingKg).toBe(5);
    expect(p!.reached).toBe(false);
  });

  it('tracks progress toward a higher goal (gaining weight)', () => {
    const p = computeWeightGoalProgress(60, 63, 70);
    expect(p!.direction).toBe('gain');
    expect(p!.progressPct).toBe(30);
    expect(p!.remainingKg).toBe(7);
  });

  it('marks reached=true once current passes the goal, clamping at 100%', () => {
    const p = computeWeightGoalProgress(80, 68, 70);
    expect(p!.reached).toBe(true);
    expect(p!.progressPct).toBe(100);
    expect(p!.remainingKg).toBe(0);
  });

  it('clamps progress at 0% when current has moved away from the goal', () => {
    const p = computeWeightGoalProgress(80, 85, 70);
    expect(p!.progressPct).toBe(0);
    expect(p!.reached).toBe(false);
    expect(p!.remainingKg).toBe(15);
  });

  it('handles start === goal (maintain) as reached only when current matches', () => {
    expect(computeWeightGoalProgress(70, 70, 70)!.reached).toBe(true);
    expect(computeWeightGoalProgress(70, 70, 70)!.progressPct).toBe(100);
    const notYet = computeWeightGoalProgress(70, 72, 70)!;
    expect(notYet.reached).toBe(false);
    expect(notYet.progressPct).toBe(0);
    expect(notYet.remainingKg).toBe(2);
  });

  it('handles start === current (no progress made yet)', () => {
    const p = computeWeightGoalProgress(80, 80, 70)!;
    expect(p.progressPct).toBe(0);
    expect(p.remainingKg).toBe(10);
  });

  it('returns null for non-finite inputs', () => {
    expect(computeWeightGoalProgress(NaN, 70, 65)).toBeNull();
    expect(computeWeightGoalProgress(80, Infinity, 65)).toBeNull();
  });
});
