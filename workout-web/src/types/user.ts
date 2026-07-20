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
  // Telegram reminder settings — read by the GitHub Actions cron script
  // (scripts/telegram-reminder.mjs) via the Firebase Admin SDK. All optional
  // so existing users default to reminders off until they opt in via
  // Settings. lastReminderSent tracks the local date each slot last fired,
  // so the every-30-min cron doesn't double-send within the same window.
  reminderEnabled?: boolean;
  reminderMorning?: string; // 'HH:MM', default '06:30'
  reminderEvening?: string; // 'HH:MM', default '19:00'
  telegramChatId?: string;
  lastReminderSent?: { morning?: string; evening?: string };
}
