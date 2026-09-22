export type ProgramDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgramFocus = 'strength' | 'cardio' | 'mixed' | 'mobility';

export interface ProgramExercise {
  presetId: string;
  nameVi: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  unit: 'reps' | 'seconds' | 'minutes';
}

export interface ProgramDay {
  id: string;
  order: number;
  nameVi: string;
  focusVi: string;
  emoji: string;
  exercises: ProgramExercise[];
}

export interface WorkoutProgram {
  id: string;
  nameVi: string;
  descriptionVi: string;
  emoji: string;
  daysPerWeek: number;
  difficulty: ProgramDifficulty;
  focus: ProgramFocus;
  estimatedMinutes: number;
  days: ProgramDay[];
  // Set on programs the user builds themselves (ProgramBuilderPage), stored
  // in UserProfile.customPrograms — absent/false on the fixed PROGRAM_TEMPLATES.
  // Lets pages show Edit/Delete only where they're valid.
  isCustom?: boolean;
  createdAt?: string;
}

export interface ActiveProgramState {
  programId: string;
  startedAt: string;
  currentDayIndex: number;
  completedDates: string[];
}
