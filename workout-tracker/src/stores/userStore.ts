import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '../types/user';
import { getUserProfile, createOrUpdateUserProfile } from '../services/userService';

interface UserStore {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;

  setFirebaseUser: (user: User | null) => void;
  loadProfile: (uid: string) => Promise<void>;
  updateProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  firebaseUser: null,
  profile: null,
  loading: true,

  setFirebaseUser: (user) => {
    set({ firebaseUser: user, loading: false });
  },

  loadProfile: async (uid) => {
    const firebaseUser = get().firebaseUser;
    const buildDefault = (): UserProfile => ({
      uid,
      displayName: firebaseUser?.displayName || 'User',
      email: firebaseUser?.email || '',
      photoURL: firebaseUser?.photoURL || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reminderEnabled: true,
      reminderTime: '07:30',
      weeklyGoalMinutes: 150,
      weeklyGoalSessions: 4,
      streak: { current: 0, longest: 0, lastWorkoutDate: '', streakStartDate: '' },
      weeklyStats: { weekStartDate: '', totalMinutes: 0, targetMinutes: 150, sessionCount: 0 },
      onboardingDone: false,
    });

    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        // Apply safe defaults for fields that may be missing in older Firestore docs
        const safe = { ...profile };
        safe.weeklyStats = {
          ...profile.weeklyStats,
          totalMinutes: profile.weeklyStats?.totalMinutes ?? 0,
          sessionCount: profile.weeklyStats?.sessionCount ?? 0,
          weekStartDate: profile.weeklyStats?.weekStartDate ?? '',
          targetMinutes: profile.weeklyStats?.targetMinutes || profile.weeklyGoalMinutes || 150,
        };
        safe.streak = {
          ...profile.streak,
          current: profile.streak?.current ?? 0,
          longest: profile.streak?.longest ?? 0,
          lastWorkoutDate: profile.streak?.lastWorkoutDate ?? '',
          streakStartDate: profile.streak?.streakStartDate ?? '',
        };
        set({ profile: safe });
      } else {
        const defaultProfile = buildDefault();
        try {
          await createOrUpdateUserProfile(uid, defaultProfile);
        } catch {
          // Firestore write failed — continue with in-memory profile
        }
        set({ profile: defaultProfile });
      }
    } catch {
      // Firestore unavailable (database not created yet, or no network)
      // Use in-memory profile so buttons work immediately
      set({ profile: buildDefault() });
    }
  },

  updateProfile: async (uid, data) => {
    await createOrUpdateUserProfile(uid, data);
    set((s) => ({
      profile: s.profile ? { ...s.profile, ...data } : null,
    }));
  },
}));
