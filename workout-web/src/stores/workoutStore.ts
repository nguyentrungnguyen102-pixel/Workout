import { create } from 'zustand';
import {
  DraftWorkout,
  ExerciseEntry,
  Intensity,
  WorkoutLog,
} from '../types/workout';
import { logWorkout as saveLog, getLogsForHeatmap } from '../services/workoutService';
import { updateStreakAfterLog, updateWeeklyMinutes } from '../services/userService';
import { getLatestBodyMetric } from '../services/bodyService';
import { computeNewPRs, PersonalRecord } from '../services/prService';
import { todayString, yesterdayString } from '../lib/date';
import { aggregateExercises } from '../lib/dayTimeline';
import { exerciseMinutes } from '../lib/energy';

interface WorkoutStore {
  draft: DraftWorkout;
  isLogging: boolean;

  yesterdayLog: WorkoutLog | null;
  todayLog: WorkoutLog | null;
  recentLogs: WorkoutLog[];
  newPRs: PersonalRecord[];

  startDraft: () => void;
  addExercise: (exercise: ExerciseEntry) => void;
  removeExercise: (presetId: string) => void;
  updateExercise: (presetId: string, updates: Partial<ExerciseEntry>) => void;
  setDraftFromLog: (log: WorkoutLog) => void;
  setIntensity: (intensity: Intensity) => void;
  setNotes: (notes: string) => void;
  setStartedAt: (date: Date) => void;
  resetDraft: () => void;

  logWorkout: (uid: string) => Promise<void>;
  clearNewPRs: () => void;
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
  newPRs: [],

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
        exercises: log.exercises.map((e) => ({ ...e })),
        startedAt: new Date(),
        intensity: log.intensity,
        notes: '',
      },
    }),

  setIntensity: (intensity) =>
    set((s) => ({ draft: { ...s.draft, intensity } })),

  setNotes: (notes) =>
    set((s) => ({ draft: { ...s.draft, notes } })),

  setStartedAt: (date) =>
    set((s) => ({ draft: { ...s.draft, startedAt: date } })),

  resetDraft: () => set({ draft: emptyDraft() }),

  logWorkout: async (uid) => {
    const { draft } = get();
    set({ isLogging: true });
    try {
      // PR baseline must come from logs saved BEFORE this one — fetch it
      // ahead of the write so the just-saved entries aren't counted against
      // themselves. '2000-01-01' matches the full-history fetch StatsPage
      // uses for the same computePRs() call.
      const existingLogs = await getLogsForHeatmap(uid, '2000-01-01');
      // Latest recorded bodyweight drives the MET-based calorie estimate in
      // logWorkout(); a missing body-metric record just means logWorkout()
      // falls back to DEFAULT_WEIGHT_KG (see lib/energy.ts).
      const latestMetric = await getLatestBodyMetric(uid).catch(() => null);
      const savedLog = await saveLog(uid, draft, latestMetric?.weight);
      const newPRs = computeNewPRs(existingLogs, savedLog);
      await updateStreakAfterLog(uid);
      await updateWeeklyMinutes(uid, draft.exercises.reduce((sum, e) => sum + exerciseMinutes(e), 0));
      set({ draft: emptyDraft(), isLogging: false, newPRs });
      await get().loadRecentLogs(uid);
    } catch (err) {
      set({ isLogging: false });
      throw err;
    }
  },

  clearNewPRs: () => set({ newPRs: [] }),

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

  // Fetches recent logs and derives todayLog + yesterdayLog from the same dataset.
  // Uses a date-range fetch (last 35 days) rather than a fixed doc count — a
  // count-based cap silently undercounts "days trained this week/month" for
  // users who log more than once a day, since older days get pushed out of
  // the window before the month/week does.
  loadRecentLogs: async (uid) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 35);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const logs = await getLogsForHeatmap(uid, cutoffStr);
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
