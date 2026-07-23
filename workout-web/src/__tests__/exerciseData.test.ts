import { describe, it, expect } from 'vitest';
import { SYSTEM_PRESETS, CATEGORY_LABELS, CATEGORY_COLORS_STATS } from '../constants/exercises';
import { EXERCISE_GUIDES } from '../constants/exerciseGuides';
import { CATEGORY_CHART_COLORS } from '../constants/chartColors';
import { CATEGORY_MET } from '../lib/energy';

// Guards against a preset being added without the supporting data every
// other preset has — a silent gap here means a picker card with a missing
// guide, or a category with no chart color, rather than a build error.
describe('SYSTEM_PRESETS data completeness', () => {
  it('every preset id is unique', () => {
    const ids = SYSTEM_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has a form-cue guide with at least one step', () => {
    const missing = SYSTEM_PRESETS.filter((p) => !EXERCISE_GUIDES[p.id]?.steps?.length).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it('every preset category has a label and a chart color', () => {
    const categories = new Set(SYSTEM_PRESETS.map((p) => p.category));
    categories.forEach((c) => {
      expect(CATEGORY_LABELS[c]).toBeTruthy();
      expect(CATEGORY_COLORS_STATS[c]).toBeTruthy();
    });
  });

  // chartColors.ts keeps a second, chart-specific per-category palette that
  // isn't type-enforced against ExerciseCategory (unlike CATEGORY_MET below)
  // — a new category silently missing here just means a chart series/axis
  // renders with no color rather than a build error, so guard it here too.
  it('every preset category has a chart-series color', () => {
    const categories = new Set(SYSTEM_PRESETS.map((p) => p.category));
    categories.forEach((c) => {
      expect(CATEGORY_CHART_COLORS[c]).toBeTruthy();
    });
  });

  it('every preset category has a MET fallback', () => {
    const categories = new Set(SYSTEM_PRESETS.map((p) => p.category));
    categories.forEach((c) => {
      expect(CATEGORY_MET[c]).toBeGreaterThan(0);
    });
  });
});
