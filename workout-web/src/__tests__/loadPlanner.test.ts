import { describe, it, expect } from 'vitest';
import { weightForReps, loadTable, warmupSets, roundToStep } from '../lib/loadPlanner';
import { estimateOneRepMax } from '../lib/oneRepMax';

describe('loadPlanner', () => {
  it('rounds to 0.5kg steps', () => {
    expect(roundToStep(10.3)).toBe(10.5);
    expect(roundToStep(10.2)).toBe(10);
    expect(roundToStep(0)).toBe(0);
    expect(roundToStep(NaN)).toBe(0);
  });

  it('inverts Epley: 10kg x 10 reps -> ~13.3 1RM -> back to 10kg at 10 reps', () => {
    const rm = estimateOneRepMax(10, 10);
    expect(weightForReps(rm, 10)).toBe(10);
  });

  it('heavier for fewer reps, 1 rep equals 1RM', () => {
    expect(weightForReps(20, 5)).toBeGreaterThan(weightForReps(20, 12));
    expect(weightForReps(20, 1)).toBe(20);
  });

  it('returns 0 / empty for invalid input', () => {
    expect(weightForReps(0, 10)).toBe(0);
    expect(weightForReps(20, 0)).toBe(0);
    expect(loadTable(0)).toEqual([]);
    expect(warmupSets(0)).toEqual([]);
  });

  it('builds a table over the target reps', () => {
    const t = loadTable(20);
    expect(t.map((s) => s.reps)).toEqual([5, 8, 10, 12, 15]);
    expect(t.every((s) => s.weight > 0)).toBe(true);
  });

  it('warm-ups are ascending, lighter than working weight, no duplicates', () => {
    const w = warmupSets(20);
    expect(w).toEqual([{ weight: 10, reps: 8 }, { weight: 14, reps: 5 }, { weight: 17, reps: 3 }]);
    const light = warmupSets(1);
    const ws = light.map((s) => s.weight);
    expect(new Set(ws).size).toBe(ws.length);
    expect(ws.every((x) => x < 1)).toBe(true);
  });
});
