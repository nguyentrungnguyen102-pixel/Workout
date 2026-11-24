import { Timestamp } from 'firebase/firestore';
import { WorkoutProgram } from './program';

export interface ExerciseGoal {
  presetId: string;
  name: string;
  targetSets: number;
  targetReps?: number;
  targetDurationSeconds?: number;
  enabled: boolean;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastWorkoutDate: string;
  streakStartDate: string;
  updatedAt?: Timestamp;
}

export interface WeeklyStats {
  weekStartDate: string;
  totalMinutes: number;
  targetMinutes: number;
  sessionCount: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  timezone: string;
  weeklyGoalMinutes: number;
  weeklyGoalSessions: number;
  sheetsId?: string;
  exerciseGoals?: ExerciseGoal[];
  streak: UserStreak;
  weeklyStats: WeeklyStats;
  createdAt?: Timestamp;
  onboardingDone: boolean;
  // Demographics — used by the fitness-assessment feature (energy.ts /
  // standards.ts) to personalize MET-based calories and pick the right
  // sex/age-band norm table. All optional: existing users may never fill
  // these in, and callers must tolerate them being absent.
  sex?: 'male' | 'female';
  birthYear?: number;
  heightCm?: number;
  // Target body weight (kg) set by the user in Settings; drives the goal
  // progress card on BodyPage (lib/weightGoal.ts). Optional — most users
  // won't set one.
  goalWeightKg?: number;
  // Telegram reminder fields (reminderEnabled/reminderMorning/...) were
  // removed in v2.36.0 together with the cron job; old docs may still carry
  // them and they are simply ignored.
  // Dumbbell weights (kg) the user owns at home — drives the weight chips
  // on the logging screen + "next step up" hint (lib/dumbbellSet.ts).
  // Optional: unset → generic default chips.
  dumbbellWeights?: number[];
  // Favorite/pinned exercise preset ids (system or custom) — surfaced first
  // in the QuickAdd exercise picker + a dedicated "Yêu thích" tab. Optional
  // so existing users default to no favorites.
  favoriteExerciseIds?: string[];
  // User-built workout programs (ProgramBuilderPage), stored alongside the
  // fixed PROGRAM_TEMPLATES so "Chương trình" can activate/track either kind
  // through the same programStore. Kept on the user doc (not a separate
  // Firestore collection) so no new security rule is needed — same pattern
  // as favoriteExerciseIds/activeProgram above.
  customPrograms?: WorkoutProgram[];
}
