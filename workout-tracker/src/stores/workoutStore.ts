import { create } from 'zustand';
import {
  DraftWorkout,
  ExerciseEntry,
  Intensity,
  WorkoutLog,
  WorkoutPreset,
} from '../types/workout';
import { logWorkout as saveLog, getYesterdayLog, getTodayLog } from '../services/workoutService';
import { updateStreakAfterLog, updateWeeklyMinutes } from '../services/userService';

interface WorkoutStore {
  // Draft state during Quick Add
  draft: DraftWorkout;
  isLogging: boolean;

  // Fetched data
  yesterdayLog: WorkoutLog | null;
  todayLog: WorkoutLog | null;
  recentLogs: WorkoutLog[];

  // Draft actions
  startDraft: () => void;
  addExercise: (exercise: ExerciseEntry) => void;
  removeExercise: (presetId: string) => void;
  setIntensity: (intensity: Intensity) => void;
  setNotes: (notes: string) => void;
  resetDraft: () => void;

  updateExercise: (presetId: string, updates: Partial<ExerciseEntry>) => void;
  setDraftFromLog: (log: WorkoutLog) => void;

  // Async actions
  logWorkout: (uid: string) => Promise<void>;
  repeatYesterday: (uid: string) => Promise<void>;
  loadYesterdayLog: (uid: string) => Promise<void>;
  loadTodayLog: (uid: string) => Promise<void>;
}

const emptyDraft = (): DraftWorkout => ({
  exercises: [],
  startedAt: null,
  intensity: 'moderate',
  notes: '',
});

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  draft: emptyDraft(),
  isLogging: false,
  yesterdayLog: null,
  todayLog: null,
  recentLogs: [],

  startDraft: () =>
    set((s) => ({
      draft: {
        ...s.draft,
        startedAt: s.draft.startedAt ?? new Date(),
      },
    })),

  addExercise: (exercise) =>
    set((s) => {
      if (s.draft.exercises.find((e) => e.presetId === exercise.presetId)) return s;
      return {
        draft: { ...s.draft, exercises: [...s.draft.exercises, exercise] },
      };
    }),

  removeExercise: (presetId) =>
    set((s) => ({
      draft: {
        ...s.draft,
        exercises: s.draft.exercises.filter((e) => e.presetId !== presetId),
      },
    })),

  setIntensity: (intensity) =>
    set((s) => ({ draft: { ...s.draft, intensity } })),

  setNotes: (notes) =>
    set((s) => ({ draft: { ...s.draft, notes } })),

  resetDraft: () => set({ draft: emptyDraft() }),

  updateExercise: (presetId, updates) =>
    set((s) => ({
      draft: {
        ...s.draft,
        exercises: s.draft.exercises.map((e) =>
          e.presetId === presetId ? { ...e, ...updates } : e
        ),
      },
    })),

  setDraftFromLog: (log) =>
    set({
      draft: {
        exercises: log.exercises.map((e) => ({ ...e })),
        startedAt: new Date(),
        intensity: log.intensity,
        notes: '',
      },
    }),

  logWorkout: async (uid) => {
    const { draft } = get();
    set({ isLogging: true });
    try {
      const logId = await saveLog(uid, draft);
      await updateStreakAfterLog(uid);
      await updateWeeklyMinutes(uid, draft.exercises.reduce((sum, e) => {
        if (e.unit === 'minutes') return sum + (e.durationSeconds || 0) / 60;
        if (e.unit === 'seconds') return sum + (e.durationSeconds || 0) / 60;
        return sum + 3;
      }, 0));
      set({ draft: emptyDraft(), isLogging: false });
      await get().loadTodayLog(uid);
    } catch (err) {
      set({ isLogging: false });
      throw err;
    }
  },

  repeatYesterday: async (uid) => {
    const { yesterdayLog } = get();
    if (!yesterdayLog) return;

    set({
      draft: {
        exercises: yesterdayLog.exercises.map((e) => ({ ...e })),
        startedAt: new Date(),
        intensity: yesterdayLog.intensity,
        notes: '',
      },
    });
  },

  loadYesterdayLog: async (uid) => {
    const log = await getYesterdayLog(uid);
    set({ yesterdayLog: log });
  },

  loadTodayLog: async (uid) => {
    const log = await getTodayLog(uid);
    set({ todayLog: log });
  },
}));
