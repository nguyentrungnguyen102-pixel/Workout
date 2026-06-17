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
  reminderEnabled: boolean;
  reminderTime: string;
  weeklyGoalMinutes: number;
  weeklyGoalSessions: number;
  fcmToken?: string;
  sheetsId?: string;
  exerciseGoals?: ExerciseGoal[];
  streak: UserStreak;
  weeklyStats: WeeklyStats;
  createdAt?: Timestamp;
  onboardingDone: boolean;
}
