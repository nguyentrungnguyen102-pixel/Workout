import { ProgramDay, ProgramExercise, WorkoutProgram } from '../types/program';

// Custom Workout Program Builder (Phase 16) — top apps (Strong, Hevy) all
// let users build their own routine, not just pick from fixed templates.
// Kept as pure functions (no Firestore/React) so the create/edit/validate
// logic is unit-testable without mocking anything.

let idCounter = 0;

// Not cryptographically unique — good enough for ids scoped to one user's
// own customPrograms array (never compared across users). The counter
// guards against two ids generated within the same millisecond.
function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCustomProgramId(): string {
  return generateId('custom');
}

export function createCustomDayId(): string {
  return generateId('day');
}

export function createEmptyCustomProgram(): WorkoutProgram {
  return {
    id: createCustomProgramId(),
    nameVi: '',
    descriptionVi: '',
    emoji: '🏋️',
    daysPerWeek: 0,
    difficulty: 'beginner',
    focus: 'strength',
    estimatedMinutes: 30,
    days: [],
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}

export function createEmptyCustomDay(order: number): ProgramDay {
  return {
    id: createCustomDayId(),
    order,
    nameVi: `Buổi ${order}`,
    focusVi: '',
    emoji: '💪',
    exercises: [],
  };
}

// Merge-lookup across the fixed templates + a user's own customPrograms —
// used by programStore and the detail/builder pages so neither list needs
// to be searched twice by callers.
export function findProgramById(
  id: string | undefined,
  templates: WorkoutProgram[],
  customPrograms: WorkoutProgram[]
): WorkoutProgram | null {
  if (!id) return null;
  return templates.find((p) => p.id === id) ?? customPrograms.find((p) => p.id === id) ?? null;
}

export function upsertCustomProgram(programs: WorkoutProgram[], program: WorkoutProgram): WorkoutProgram[] {
  const exists = programs.some((p) => p.id === program.id);
  return exists
    ? programs.map((p) => (p.id === program.id ? program : p))
    : [...programs, program];
}

export function removeCustomProgram(programs: WorkoutProgram[], programId: string): WorkoutProgram[] {
  return programs.filter((p) => p.id !== programId);
}

function isValidExercise(ex: ProgramExercise): boolean {
  if (!ex.presetId || !ex.nameVi.trim()) return false;
  if (!Number.isFinite(ex.sets) || ex.sets < 1) return false;
  if (ex.unit === 'reps') return Number.isFinite(ex.reps) && (ex.reps as number) >= 1;
  if (ex.unit === 'seconds' || ex.unit === 'minutes') {
    return Number.isFinite(ex.durationSeconds) && (ex.durationSeconds as number) >= 1;
  }
  return false;
}

// Returns a list of Vietnamese validation messages (empty = valid) — shown
// directly in ProgramBuilderPage, so wording lives here alongside the rules.
export function validateCustomProgram(program: WorkoutProgram): string[] {
  const errors: string[] = [];

  if (!program.nameVi.trim()) errors.push('Nhập tên chương trình.');
  if (program.days.length === 0) errors.push('Thêm ít nhất 1 buổi tập.');

  program.days.forEach((day, idx) => {
    const label = day.nameVi.trim() || `Buổi ${idx + 1}`;
    if (!day.nameVi.trim()) errors.push(`Buổi ${idx + 1}: nhập tên buổi tập.`);
    if (day.exercises.length === 0) errors.push(`${label}: thêm ít nhất 1 bài tập.`);
    if (day.exercises.some((ex) => !isValidExercise(ex))) {
      errors.push(`${label}: có bài tập chưa nhập đủ số hiệp/số lượng.`);
    }
  });

  return errors;
}

// daysPerWeek on WorkoutProgram is a display count (matches PROGRAM_TEMPLATES
// convention), not a schedule — for a custom program it's simply how many
// distinct days the user built.
export function finalizeCustomProgram(program: WorkoutProgram): WorkoutProgram {
  return {
    ...program,
    nameVi: program.nameVi.trim(),
    descriptionVi: program.descriptionVi.trim(),
    daysPerWeek: program.days.length,
    days: program.days.map((day, idx) => ({ ...day, order: idx + 1, nameVi: day.nameVi.trim() })),
  };
}
