import { describe, it, expect } from 'vitest';
import { SYSTEM_PRESETS, CATEGORY_LABELS, CATEGORY_COLORS_STATS, MUSCLE_GROUP_LABELS } from '../constants/exercises';
import { EXERCISE_GUIDES } from '../constants/exerciseGuides';
import { CATEGORY_CHART_COLORS } from '../constants/chartColors';
import { CATEGORY_MET } from '../lib/energy';
import { PROGRAM_TEMPLATES } from '../constants/programTemplates';

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

  // Guards the "Cân bằng nhóm cơ" chart (Đợt 3) — a preset added without a
  // muscleGroup tag would silently vanish from every axis instead of
  // showing up as 'fullBody', so a build/data-completeness error here is
  // preferable to a silently-wrong chart.
  it('every preset has a valid muscleGroup', () => {
    const missing = SYSTEM_PRESETS.filter((p) => !p.muscleGroup || !MUSCLE_GROUP_LABELS[p.muscleGroup]).map((p) => p.id);
    expect(missing).toEqual([]);
  });
});

// Guards program templates against referencing a typo'd/removed preset id —
// a silent gap here means ProgramDetailPage renders a card with no icon/guide
// for that exercise, rather than a build error.
describe('PROGRAM_TEMPLATES data completeness', () => {
  const presetIds = new Set(SYSTEM_PRESETS.map((p) => p.id));

  it('every program id is unique', () => {
    const ids = PROGRAM_TEMPLATES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every program day id is unique across all programs', () => {
    const dayIds = PROGRAM_TEMPLATES.flatMap((p) => p.days.map((d) => d.id));
    expect(new Set(dayIds).size).toBe(dayIds.length);
  });

  it('every program day exercise references a real preset id', () => {
    const missing: string[] = [];
    PROGRAM_TEMPLATES.forEach((p) => {
      p.days.forEach((d) => {
        d.exercises.forEach((ex) => {
          if (!presetIds.has(ex.presetId)) missing.push(`${p.id}/${d.id}/${ex.presetId}`);
        });
      });
    });
    expect(missing).toEqual([]);
  });
});

// Phase 17 (v2.34.0) — bài tạ đơn tại nhà mới + 2 chương trình dùng chúng.
describe('Phase 17 home dumbbell additions', () => {
  const NEW_IDS = [
    'db_reverse_lunge', 'db_lateral_lunge', 'db_glute_bridge', 'db_cross_body_curl',
    'db_y_raise', 'db_pushup_grip', 'db_bird_dog_row', 'db_curl_press',
  ];

  it('all 8 new exercises exist as dumbbell presets with a guide', () => {
    NEW_IDS.forEach((id) => {
      const p = SYSTEM_PRESETS.find((x) => x.id === id);
      expect(p?.category).toBe('dumbbell');
      expect(EXERCISE_GUIDES[id]?.steps.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('new programs exist and every new exercise is used by some program', () => {
    expect(PROGRAM_TEMPLATES.find((p) => p.id === 'dumbbell_home_express_3x')?.days).toHaveLength(3);
    expect(PROGRAM_TEMPLATES.find((p) => p.id === 'dumbbell_home_full_4x')?.days).toHaveLength(4);
    const used = new Set(PROGRAM_TEMPLATES.flatMap((p) => p.days.flatMap((d) => d.exercises.map((e) => e.presetId))));
    NEW_IDS.forEach((id) => expect(used.has(id)).toBe(true));
  });

  it('program daysPerWeek matches the number of days', () => {
    PROGRAM_TEMPLATES.filter((p) => p.id.startsWith('dumbbell_home_express') || p.id.startsWith('dumbbell_home_full'))
      .forEach((p) => expect(p.days.length).toBe(p.daysPerWeek));
  });
});
