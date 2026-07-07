import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DraftWorkout, WorkoutLog, WorkoutPreset, Intensity } from '../types/workout';
import { todayString, yesterdayString } from '../lib/date';

function deriveIntensity(exercises: WorkoutLog['exercises']): { intensity: Intensity; score: number } {
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  if (totalSets >= 12) return { intensity: 'heavy', score: 8 };
  if (totalSets >= 6) return { intensity: 'moderate', score: 5 };
  return { intensity: 'light', score: 3 };
}

export async function logWorkout(uid: string, draft: DraftWorkout): Promise<string> {
  if (draft.exercises.length === 0) throw new Error('No exercises');

  // Date is derived from the (possibly back-dated) startedAt so the log lands
  // on the correct calendar day when the user forgot to record in realtime.
  const when = draft.startedAt ?? new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;

  // Always sum exercise times — elapsed-since-start is meaningless once the
  // user can back-date startedAt.
  const totalDurationMinutes = Math.max(1, Math.round(draft.exercises.reduce((sum, e) => {
    if (e.unit === 'minutes' || e.unit === 'seconds') return sum + (e.durationSeconds || 0) / 60;
    return sum + 3; // reps ≈ 3 min
  }, 0)));

  const { intensity, score } = deriveIntensity(draft.exercises);
  const caloriesEstimate = Math.round(totalDurationMinutes * 7);

  const cleanExercises = draft.exercises.map((e) => {
    const c: Record<string, any> = {
      presetId: e.presetId,
      name: e.name,
      category: e.category,
      unit: e.unit,
      sets: e.sets ?? 1,
    };
    if (e.reps !== undefined) c.reps = e.reps;
    if (e.durationSeconds !== undefined) c.durationSeconds = e.durationSeconds;
    if (e.weight !== undefined) c.weight = e.weight;
    if (e.distance !== undefined) c.distance = e.distance;
    return c;
  });

  // Each log call creates a new document (multiple logs per day supported)
  const logRef = doc(collection(db, 'logs'));
  const logData: Record<string, any> = {
    id: logRef.id,
    userId: uid,
    date,
    exercises: cleanExercises,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    intensityScore: score,
    intensity: draft.intensity || intensity,
    caloriesEstimate,
    source: 'manual',
    syncedToSheets: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (draft.notes) logData.notes = draft.notes;
  if (draft.startedAt) logData.startedAt = Timestamp.fromDate(draft.startedAt);

  await setDoc(logRef, logData);

  // Increment usageCount on presets
  await Promise.all(
    draft.exercises.map((e) =>
      updateDoc(doc(db, 'workouts', e.presetId), {
        usageCount: increment(1),
        lastUsedAt: todayString(),
      }).catch(() => null)
    )
  );

  return logRef.id;
}

export async function getRecentLogs(uid: string, count = 10): Promise<WorkoutLog[]> {
  // orderBy('date', 'desc') must come before limit() — without it Firestore
  // orders by document ID (random, since logRef uses an auto-ID), so the
  // 200-doc window can silently drop the most recent logs once a user passes
  // 200 total entries.
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now());
    })
    .slice(0, count);
}

export async function getLogsForHeatmap(uid: string, startDate: string): Promise<WorkoutLog[]> {
  // Filters by date range server-side (using the existing userId+date index)
  // instead of fetching an arbitrary 200-doc window and filtering client-side,
  // which silently drops logs for users with more than 200 total entries.
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid),
    where('date', '>=', startDate),
    orderBy('date', 'asc'),
    limit(2000)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WorkoutLog);
}

export function buildDraftFromLog(log: WorkoutLog): DraftWorkout {
  return {
    exercises: log.exercises.map((e) => ({ ...e })),
    startedAt: new Date(),
    intensity: log.intensity,
    notes: '',
  };
}

export async function getLogById(logId: string): Promise<WorkoutLog | null> {
  const snap = await getDoc(doc(db, 'logs', logId));
  return snap.exists() ? (snap.data() as WorkoutLog) : null;
}

export async function getLogsForExercise(uid: string, presetId: string): Promise<WorkoutLog[]> {
  // No index exists on individual exercise presetIds within the exercises
  // array, so this still fetches-then-filters client-side — but ordering by
  // date desc (matching the existing composite index) means the fetched
  // window is the most recent logs, not an arbitrary slice.
  const q = query(collection(db, 'logs'), where('userId', '==', uid), orderBy('date', 'desc'), limit(500));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => log.exercises.some((e) => e.presetId === presetId))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLogsForDate(uid: string, date: string): Promise<WorkoutLog[]> {
  // Exact-match equality filters don't need a composite index, so this can
  // filter server-side instead of scanning a capped, potentially-stale window.
  const q = query(collection(db, 'logs'), where('userId', '==', uid), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));
}
