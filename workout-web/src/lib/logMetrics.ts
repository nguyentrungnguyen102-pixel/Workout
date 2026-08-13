import { ExerciseEntry, Intensity, WorkoutLog } from '../types/workout';
import { exerciseMinutes, logKcal } from './energy';

// Shared derivation logic between creating a new log (workoutService.logWorkout)
// and editing an existing one (workoutService.updateWorkoutLog) — kept as a
// pure function so both call sites compute date/duration/intensity/calories
// identically instead of drifting apart, and so it's testable without Firestore.

export interface LogMetrics {
  date: string;
  exercises: ExerciseEntry[];
  totalDurationMinutes: number;
  intensity: Intensity;
  intensityScore: number;
  caloriesEstimate: number;
}

function deriveIntensity(exercises: ExerciseEntry[]): { intensity: Intensity; score: number } {
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  if (totalSets >= 12) return { intensity: 'heavy', score: 8 };
  if (totalSets >= 6) return { intensity: 'moderate', score: 5 };
  return { intensity: 'light', score: 3 };
}

// Strips undefined optional fields so the object is safe to write straight to
// Firestore (setDoc/updateDoc reject `undefined` values).
function cleanExercise(e: ExerciseEntry): ExerciseEntry {
  const c: Record<string, any> = {
    presetId: e.presetId,
    name: e.name,
    category: e.category,
    unit: e.unit,
    sets: e.sets ?? 1,
  };
  if (e.reps !== undefined) c.reps = e.reps;
  if (e.durationSeconds !== undefined) c.durationSeconds = e.durationSeconds;
  if (e.weight !== undefined) c.weight = e.weight;
  if (e.distance !== undefined) c.distance = e.distance;
  return c as ExerciseEntry;
}

export function computeLogMetrics(
  exercises: ExerciseEntry[],
  startedAt: Date | null,
  intensityOverride: Intensity | undefined,
  weightKg: number | undefined
): LogMetrics {
  if (exercises.length === 0) throw new Error('No exercises');

  // Date is derived from the (possibly back-dated) startedAt so the log lands
  // on the correct calendar day when the user forgot to record in realtime.
  const when = startedAt ?? new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;

  const cleanExercises = exercises.map(cleanExercise);
  const totalDurationMinutes = Math.max(
    1,
    Math.round(exercises.reduce((sum, e) => sum + exerciseMinutes(e), 0))
  );
  const { intensity, score } = deriveIntensity(exercises);
  const caloriesEstimate = logKcal({ exercises } as WorkoutLog, weightKg ?? 0);

  return {
    date,
    exercises: cleanExercises,
    totalDurationMinutes,
    intensity: intensityOverride || intensity,
    intensityScore: score,
    caloriesEstimate,
  };
}
