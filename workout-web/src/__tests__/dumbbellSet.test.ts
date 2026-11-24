import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DUMBBELL_CHIPS,
  DUMBBELL_SET_PRESETS,
  MAX_DUMBBELL_WEIGHTS,
  MAX_VISIBLE_CHIPS,
  formatDumbbellSet,
  isOffSetWeight,
  nextHeavierWeight,
  nextLighterWeight,
  normalizeDumbbellWeights,
  parseDumbbellWeightsText,
  toggleDumbbellWeight,
  weightChipsFor,
} from '../lib/dumbbellSet';

describe('normalizeDumbbellWeights', () => {
  it('sorts, dedupes and drops invalid values', () => {
    expect(normalizeDumbbellWeights([6, 2, 4, 2, -1, 0, NaN, 150, 'x'])).toEqual([2, 4, 6]);
  });
  it('rounds to 0.25 kg and accepts numeric strings', () => {
    expect(normalizeDumbbellWeights(['2.5', 7.49, '3,5'])).toEqual([2.5, 3.5, 7.5]);
  });
  it('handles undefined / non-array', () => {
    expect(normalizeDumbbellWeights(undefined)).toEqual([]);
    expect(normalizeDumbbellWeights(null)).toEqual([]);
  });
  it('caps the list length', () => {
    const many = Array.from({ length: 80 }, (_, i) => i + 1);
    expect(normalizeDumbbellWeights(many)).toHaveLength(MAX_DUMBBELL_WEIGHTS);
  });
});

describe('parseDumbbellWeightsText', () => {
  it('parses separators and kg suffix', () => {
    expect(parseDumbbellWeightsText('2, 4; 6.5 8kg / 10')).toEqual([2, 4, 6.5, 8, 10]);
  });
  it('treats a lone "7,5" as a decimal comma', () => {
    expect(parseDumbbellWeightsText('7,5')).toEqual([7.5]);
    expect(parseDumbbellWeightsText('7,5kg')).toEqual([7.5]);
  });
  it('returns [] for empty input', () => {
    expect(parseDumbbellWeightsText('   ')).toEqual([]);
  });
});

describe('toggleDumbbellWeight', () => {
  it('adds then removes, keeping order', () => {
    const a = toggleDumbbellWeight([2, 6], 4);
    expect(a).toEqual([2, 4, 6]);
    expect(toggleDumbbellWeight(a, 4)).toEqual([2, 6]);
  });
  it('does not mutate input', () => {
    const src = [2];
    toggleDumbbellWeight(src, 4);
    expect(src).toEqual([2]);
  });
  it('treats undefined as empty', () => {
    expect(toggleDumbbellWeight(undefined, 5)).toEqual([5]);
  });
});

describe('presets', () => {
  it('every preset is already normalized', () => {
    for (const p of DUMBBELL_SET_PRESETS) {
      expect(normalizeDumbbellWeights(p.weights)).toEqual(p.weights);
      expect(p.weights.length).toBeGreaterThan(0);
    }
  });
  it('adjustable 20 kg preset has no float drift', () => {
    const p = DUMBBELL_SET_PRESETS.find((x) => x.id === 'adjustable-20')!;
    expect(p.weights).toEqual([2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20]);
  });
});

describe('weightChipsFor', () => {
  it('falls back to default chips when no set configured', () => {
    expect(weightChipsFor(undefined)).toEqual(DEFAULT_DUMBBELL_CHIPS);
    expect(weightChipsFor([])).toEqual(DEFAULT_DUMBBELL_CHIPS);
  });
  it('returns the whole small set', () => {
    expect(weightChipsFor([2, 4, 6], 4)).toEqual([2, 4, 6]);
  });
  it('windows a big set around the current weight', () => {
    const set = Array.from({ length: 12 }, (_, i) => (i + 1) * 2); // 2..24
    const chips = weightChipsFor(set, 14);
    expect(chips).toHaveLength(MAX_VISIBLE_CHIPS);
    expect(chips).toContain(14);
    expect(chips[0]).toBe(8);
  });
  it('starts at the lightest when no current weight', () => {
    const set = Array.from({ length: 12 }, (_, i) => (i + 1) * 2);
    expect(weightChipsFor(set)[0]).toBe(2);
  });
  it('clamps the window at the heavy end', () => {
    const set = Array.from({ length: 12 }, (_, i) => (i + 1) * 2);
    const chips = weightChipsFor(set, 24);
    expect(chips[chips.length - 1]).toBe(24);
    expect(chips).toHaveLength(MAX_VISIBLE_CHIPS);
  });
});

describe('next heavier / lighter', () => {
  const set = [2, 4, 6, 8];
  it('finds the next step up and down', () => {
    expect(nextHeavierWeight(set, 4)).toBe(6);
    expect(nextLighterWeight(set, 4)).toBe(2);
  });
  it('works for weights between steps', () => {
    expect(nextHeavierWeight(set, 5)).toBe(6);
    expect(nextLighterWeight(set, 5)).toBe(4);
  });
  it('returns null at the edges or with no set', () => {
    expect(nextHeavierWeight(set, 8)).toBeNull();
    expect(nextLighterWeight(set, 2)).toBeNull();
    expect(nextHeavierWeight(undefined, 4)).toBeNull();
  });
});

describe('isOffSetWeight / formatDumbbellSet', () => {
  it('flags weights not in the set only when a set exists', () => {
    expect(isOffSetWeight([2, 4], 3)).toBe(true);
    expect(isOffSetWeight([2, 4], 4)).toBe(false);
    expect(isOffSetWeight([], 3)).toBe(false);
    expect(isOffSetWeight([2, 4], undefined)).toBe(false);
  });
  it('formats short and long sets', () => {
    expect(formatDumbbellSet([])).toBe('Chưa khai báo');
    expect(formatDumbbellSet([2, 4, 6])).toBe('2 · 4 · 6 kg');
    expect(formatDumbbellSet([2, 4, 6, 8, 10, 12, 14])).toBe('2 → 14 kg · 7 mức');
  });
});
