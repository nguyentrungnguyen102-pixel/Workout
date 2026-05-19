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
    const profile = await getUserProfile(uid);
    if (profile) {
      set({ profile });
    } else {
      // New user — create default profile
      const defaultProfile: UserProfile = {
        uid,
        displayName: get().firebaseUser?.displayName || 'User',
        email: get().firebaseUser?.email || '',
        photoURL: get().firebaseUser?.photoURL || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reminderEnabled: true,
        reminderTime: '07:30',
        weeklyGoalMinutes: 150,
        weeklyGoalSessions: 4,
        streak: {
          current: 0,
          longest: 0,
          lastWorkoutDate: '',
          streakStartDate: '',
        },
        weeklyStats: {
          weekStartDate: '',
          totalMinutes: 0,
          targetMinutes: 150,
          sessionCount: 0,
        },
        onboardingDone: false,
      };
      await createOrUpdateUserProfile(uid, defaultProfile);
      set({ profile: defaultProfile });
    }
  },

  updateProfile: async (uid, data) => {
    await createOrUpdateUserProfile(uid, data);
    set((s) => ({
      profile: s.profile ? { ...s.profile, ...data } : null,
    }));
  },
}));
