import { Timestamp } from 'firebase/firestore';

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
  n8nWebhookUrl?: string;
  streak: UserStreak;
  weeklyStats: WeeklyStats;
  createdAt?: Timestamp;
  onboardingDone: boolean;
}
