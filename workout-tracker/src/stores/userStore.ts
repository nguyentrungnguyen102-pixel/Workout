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
        set({ profile });
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
