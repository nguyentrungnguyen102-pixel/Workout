import { Timestamp } from 'firebase/firestore';

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'recovery' | 'dumbbell' | 'core' | 'sport';
export type ExerciseUnit = 'reps' | 'seconds' | 'minutes' | 'km';
export type Intensity = 'light' | 'moderate' | 'heavy';
export type LogSource = 'manual' | 'voice' | 'repeat_yesterday';

// Anatomical muscle group targeted, for the "Cân bằng nhóm cơ" chart —
// distinct from ExerciseCategory (an equipment/discipline grouping: cardio,
// dumbbell, sport... which doesn't say WHICH muscles a dumbbell exercise
// actually works). Optional on WorkoutPreset because user-created custom
// presets (customExerciseService.ts) don't collect one — callers computing
// the chart should fall back to 'fullBody' when absent.
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'fullBody';

export interface WorkoutPreset {
  id: string;
  name: string;
  nameVi: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  defaultValue: number;
  defaultSets?: number;
  icon: string;
  isCustom: boolean;
  userId?: string;
  usageCount: number;
  lastUsedAt?: string;
  muscleGroup?: MuscleGroup;
}

export interface ExerciseEntry {
  presetId: string;
  name: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  weight?: number;
  distance?: number;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string;
  exercises: ExerciseEntry[];
  totalDurationMinutes: number;
  intensityScore: number;
  intensity: Intensity;
  caloriesEstimate: number;
  notes?: string;
  location?: string;
  source: LogSource;
  syncedToSheets: boolean;
  createdAt?: Timestamp;
  startedAt?: Timestamp;
  // Soft-delete flag — see workoutService.softDeleteLog(). Every read
  // function filters these out client-side; absent (undefined) on all
  // pre-existing logs, which the `!log.deleted` checks treat as "not deleted".
  deleted?: boolean;
  deletedAt?: Timestamp;
}

// Draft built up during Quick Add session in Zustand
export interface DraftWorkout {
  exercises: ExerciseEntry[];
  startedAt: Date | null;
  intensity: Intensity;
  notes: string;
  location: string;
}
