import { Timestamp } from 'firebase/firestore';

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
}
