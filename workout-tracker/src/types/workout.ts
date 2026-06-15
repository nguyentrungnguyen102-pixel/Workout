import { Timestamp } from 'firebase/firestore';

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'recovery' | 'dumbbell';
export type ExerciseUnit = 'reps' | 'seconds' | 'minutes' | 'km';
export type Intensity = 'light' | 'moderate' | 'heavy';
export type LogSource = 'manual' | 'voice' | 'repeat_yesterday';
export type MuscleGroup = 'arms' | 'shoulders' | 'chest' | 'back' | 'legs_glutes' | 'full_body';

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
  source: LogSource;
  syncedToSheets: boolean;
  createdAt?: Timestamp;
}

// Draft built up during Quick Add session in Zustand
export interface DraftWorkout {
  exercises: ExerciseEntry[];
  startedAt: Date | null;
  intensity: Intensity;
  notes: string;
}

// Saved workout template (named routine)
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: ExerciseEntry[];
  createdAt?: import('firebase/firestore').Timestamp;
}
