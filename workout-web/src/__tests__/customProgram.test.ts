import { describe, it, expect } from 'vitest';
import {
  createCustomProgramId,
  createEmptyCustomProgram,
  createEmptyCustomDay,
  findProgramById,
  upsertCustomProgram,
  removeCustomProgram,
  validateCustomProgram,
  finalizeCustomProgram,
} from '../lib/customProgram';
import { WorkoutProgram } from '../types/program';

function makeProgram(overrides: Partial<WorkoutProgram> = {}): WorkoutProgram {
  return {
    ...createEmptyCustomProgram(),
    nameVi: 'Chương trình của tôi',
    days: [
      {
        id: 'day_1',
        order: 1,
        nameVi: 'Buổi A',
        focusVi: 'Ngực',
        emoji: '💪',
        exercises: [
          { presetId: 'pushup', nameVi: 'Hít đất', sets: 3, reps: 20, unit: 'reps' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('createCustomProgramId / createEmptyCustomDay', () => {
  it('generates unique, prefixed ids', () => {
    const a = createCustomProgramId();
    const b = createCustomProgramId();
    expect(a).not.toEqual(b);
    expect(a.startsWith('custom_')).toBe(true);
  });

  it('creates a day with an incrementing default name', () => {
    const day = createEmptyCustomDay(2);
    expect(day.nameVi).toBe('Buổi 2');
    expect(day.exercises).toEqual([]);
    expect(day.order).toBe(2);
  });

  it('creates an empty program flagged as custom', () => {
    const program = createEmptyCustomProgram();
    expect(program.isCustom).toBe(true);
    expect(program.days).toEqual([]);
    expect(program.id.startsWith('custom_')).toBe(true);
  });
});

describe('findProgramById', () => {
  const templates: WorkoutProgram[] = [makeProgram({ id: 'tpl_1', isCustom: false })];
  const custom: WorkoutProgram[] = [makeProgram({ id: 'custom_1' })];

  it('finds a template by id', () => {
    expect(findProgramById('tpl_1', templates, custom)?.id).toBe('tpl_1');
  });

  it('finds a custom program by id when not in templates', () => {
    expect(findProgramById('custom_1', templates, custom)?.id).toBe('custom_1');
  });

  it('returns null for an unknown id', () => {
    expect(findProgramById('nope', templates, custom)).toBeNull();
  });

  it('returns null for an undefined id', () => {
    expect(findProgramById(undefined, templates, custom)).toBeNull();
  });
});

describe('upsertCustomProgram / removeCustomProgram', () => {
  it('appends a new program', () => {
    const p1 = makeProgram({ id: 'custom_1' });
    const result = upsertCustomProgram([], p1);
    expect(result).toEqual([p1]);
  });

  it('replaces an existing program with the same id', () => {
    const p1 = makeProgram({ id: 'custom_1', nameVi: 'Cũ' });
    const p1Updated = makeProgram({ id: 'custom_1', nameVi: 'Mới' });
    const result = upsertCustomProgram([p1], p1Updated);
    expect(result).toHaveLength(1);
    expect(result[0].nameVi).toBe('Mới');
  });

  it('does not mutate the input array', () => {
    const original = [makeProgram({ id: 'custom_1' })];
    const snapshot = [...original];
    upsertCustomProgram(original, makeProgram({ id: 'custom_2' }));
    expect(original).toEqual(snapshot);
  });

  it('removes a program by id', () => {
    const p1 = makeProgram({ id: 'custom_1' });
    const p2 = makeProgram({ id: 'custom_2' });
    expect(removeCustomProgram([p1, p2], 'custom_1')).toEqual([p2]);
  });
});

describe('validateCustomProgram', () => {
  it('accepts a well-formed program', () => {
    expect(validateCustomProgram(makeProgram())).toEqual([]);
  });

  it('requires a name', () => {
    const errors = validateCustomProgram(makeProgram({ nameVi: '   ' }));
    expect(errors).toContain('Nhập tên chương trình.');
  });

  it('requires at least 1 day', () => {
    const errors = validateCustomProgram(makeProgram({ days: [] }));
    expect(errors).toContain('Thêm ít nhất 1 buổi tập.');
  });

  it('requires each day to have a name', () => {
    const program = makeProgram();
    program.days[0].nameVi = '';
    expect(validateCustomProgram(program)).toContain('Buổi 1: nhập tên buổi tập.');
  });

  it('requires each day to have at least 1 exercise', () => {
    const program = makeProgram();
    program.days[0].exercises = [];
    expect(validateCustomProgram(program)).toContain('Buổi A: thêm ít nhất 1 bài tập.');
  });

  it('rejects a reps exercise with no reps value', () => {
    const program = makeProgram();
    program.days[0].exercises = [{ presetId: 'pushup', nameVi: 'Hít đất', sets: 3, unit: 'reps' }];
    expect(validateCustomProgram(program)).toContain('Buổi A: có bài tập chưa nhập đủ số hiệp/số lượng.');
  });

  it('rejects a seconds exercise with no duration', () => {
    const program = makeProgram();
    program.days[0].exercises = [{ presetId: 'plank', nameVi: 'Plank', sets: 3, unit: 'seconds' }];
    expect(validateCustomProgram(program)).toContain('Buổi A: có bài tập chưa nhập đủ số hiệp/số lượng.');
  });

  it('rejects sets below 1', () => {
    const program = makeProgram();
    program.days[0].exercises[0].sets = 0;
    expect(validateCustomProgram(program)).toContain('Buổi A: có bài tập chưa nhập đủ số hiệp/số lượng.');
  });

  it('collects multiple errors at once', () => {
    const errors = validateCustomProgram(makeProgram({ nameVi: '', days: [] }));
    expect(errors).toHaveLength(2);
  });
});

describe('finalizeCustomProgram', () => {
  it('trims names and derives daysPerWeek from the day count', () => {
    const program = makeProgram({ nameVi: '  Tên  ', descriptionVi: '  Mô tả  ' });
    const result = finalizeCustomProgram(program);
    expect(result.nameVi).toBe('Tên');
    expect(result.descriptionVi).toBe('Mô tả');
    expect(result.daysPerWeek).toBe(1);
  });

  it('renumbers day order sequentially and trims day names', () => {
    const program = makeProgram({
      days: [
        { id: 'a', order: 5, nameVi: '  Buổi X  ', focusVi: '', emoji: '💪', exercises: [] },
        { id: 'b', order: 1, nameVi: 'Buổi Y', focusVi: '', emoji: '💪', exercises: [] },
      ],
    });
    const result = finalizeCustomProgram(program);
    expect(result.days.map((d) => d.order)).toEqual([1, 2]);
    expect(result.days[0].nameVi).toBe('Buổi X');
  });
});
