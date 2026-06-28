import { create } from 'zustand';
import {
  DraftWorkout,
  ExerciseEntry,
  Intensity,
  WorkoutLog,
} from '../types/workout';
import { logWorkout as saveLog, getRecentLogs } from '../services/workoutService';
import { updateStreakAfterLog, updateWeeklyMinutes } from '../services/userService';
import { todayString, yesterdayString } from '../lib/date';
import { aggregateExercises } from '../lib/dayTimeline';

interface WorkoutStore {
  draft: DraftWorkout;
  isLogging: boolean;

  yesterdayLog: WorkoutLog | null;
  todayLog: WorkoutLog | null;
  recentLogs: WorkoutLog[];

  startDraft: () => void;
  addExercise: (exercise: ExerciseEntry) => void;
  removeExercise: (presetId: string) => void;
  updateExercise: (presetId: string, updates: Partial<ExerciseEntry>) => void;
  setDraftFromLog: (log: WorkoutLog) => void;
  setIntensity: (intensity: Intensity) => void;
  setNotes: (notes: string) => void;
  resetDraft: () => void;

  logWorkout: (uid: string) => Promise<void>;
  repeatYesterday: (uid: string) => Promise<void>;
  loadYesterdayLog: (uid: string) => Promise<void>;
  loadTodayLog: (uid: string) => Promise<void>;
  loadRecentLogs: (uid: string) => Promise<void>;
}

const emptyDraft = (): DraftWorkout => ({
  exercises: [],
  startedAt: null,
  intensity: 'moderate',
  notes: '',
});

// Merge exercises from multiple logs (deduplicated by presetId, keep most recent)
function mergeExercises(logs: WorkoutLog[]): WorkoutLog['exercises'] {
  const merged: WorkoutLog['exercises'] = [];
  const seen = new Set<string>();
  logs.forEach((log) => {
    log.exercises.forEach((e) => {
      if (!seen.has(e.presetId)) {
        seen.add(e.presetId);
        merged.push(e);
      }
    });
  });
  return merged;
}

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
        exercises: log.exercises.map((e) => {
          if (!e.setLog || e.setLog.length === 0) {
            const n = e.sets || 3;
            return {
              ...e,
              setLog: Array.from({ length: n }, () => ({
                reps: e.reps,
                durationSeconds: e.durationSeconds,
                done: false,
              })),
            };
          }
          return { ...e };
        }),
        startedAt: new Date(),
        intensity: log.intensity,
        notes: '',
      },
    }),

  setIntensity: (intensity) =>
    set((s) => ({ draft: { ...s.draft, intensity } })),

  setNotes: (notes) =>
    set((s) => ({ draft: { ...s.draft, notes } })),

  resetDraft: () => set({ draft: emptyDraft() }),

  logWorkout: async (uid) => {
    const { draft } = get();
    set({ isLogging: true });
    try {
      await saveLog(uid, draft);
      await updateStreakAfterLog(uid);
      await updateWeeklyMinutes(uid, draft.exercises.reduce((sum, e) => {
        if (e.unit === 'minutes') return sum + (e.durationSeconds || 0) / 60;
        if (e.unit === 'seconds') return sum + (e.durationSeconds || 0) / 60;
        return sum + 3;
      }, 0));
      set({ draft: emptyDraft(), isLogging: false });
      await get().loadRecentLogs(uid);
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

  // Fetches recent logs and derives todayLog + yesterdayLog from the same dataset
  loadRecentLogs: async (uid) => {
    const logs = await getRecentLogs(uid, 30);
    const today = todayString();
    const yesterday = yesterdayString();

    const todayLogs = logs.filter((l) => l.date === today);
    const todayLog = todayLogs.length
      ? { ...todayLogs[0], exercises: aggregateExercises(todayLogs) }
      : null;

    const yesterdayLogs = logs.filter((l) => l.date === yesterday);
    let yesterdayLog: WorkoutLog | null = null;
    if (yesterdayLogs.length === 1) {
      yesterdayLog = yesterdayLogs[0];
    } else if (yesterdayLogs.length > 1) {
      yesterdayLog = { ...yesterdayLogs[0], exercises: mergeExercises(yesterdayLogs) };
    }

    set({ recentLogs: logs, todayLog, yesterdayLog });
  },

  loadYesterdayLog: async (uid) => { await get().loadRecentLogs(uid); },
  loadTodayLog: async (uid) => { await get().loadRecentLogs(uid); },
}));
