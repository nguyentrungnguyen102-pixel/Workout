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

// Returns intensity label and score (1-10) from exercises
function deriveIntensity(exercises: WorkoutLog['exercises']): { intensity: Intensity; score: number } {
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  if (totalSets >= 12) return { intensity: 'heavy', score: 8 };
  if (totalSets >= 6) return { intensity: 'moderate', score: 5 };
  return { intensity: 'light', score: 3 };
}

export async function logWorkout(uid: string, draft: DraftWorkout): Promise<string> {
  if (draft.exercises.length === 0) throw new Error('No exercises');

  const date = todayString();
  // One log per user per day — compound key for upsert
  const logId = `${uid}_${date}`;
  const logRef = doc(db, 'logs', logId);

  const totalDurationMinutes = draft.startedAt
    ? Math.max(1, Math.round((Date.now() - draft.startedAt.getTime()) / 60_000))
    : draft.exercises.reduce((sum, e) => {
        if (e.unit === 'minutes') return sum + e.durationSeconds! / 60;
        if (e.unit === 'seconds') return sum + (e.durationSeconds || 0) / 60;
        return sum + 3; // estimate 3 min per strength exercise
      }, 0);

  const { intensity, score } = deriveIntensity(draft.exercises);
  const caloriesEstimate = Math.round(totalDurationMinutes * 7);

  const logData: Omit<WorkoutLog, 'id'> = {
    userId: uid,
    date,
    exercises: draft.exercises,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    intensityScore: score,
    intensity: draft.intensity || intensity,
    caloriesEstimate,
    notes: draft.notes || undefined,
    source: 'manual',
    syncedToSheets: false,
  };

  await setDoc(
    logRef,
    { ...logData, id: logId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );

  // Increment usageCount on presets
  await Promise.all(
    draft.exercises.map((e) =>
      updateDoc(doc(db, 'workouts', e.presetId), {
        usageCount: increment(1),
        lastUsedAt: todayString(),
      }).catch(() => null) // preset may not exist in Firestore yet for system presets
    )
  );

  return logId;
}

export async function getTodayLog(uid: string): Promise<WorkoutLog | null> {
  const logId = `${uid}_${todayString()}`;
  const snap = await getDoc(doc(db, 'logs', logId));
  return snap.exists() ? (snap.data() as WorkoutLog) : null;
}

export async function getYesterdayLog(uid: string): Promise<WorkoutLog | null> {
  const logId = `${uid}_${yesterdayString()}`;
  const snap = await getDoc(doc(db, 'logs', logId));
  return snap.exists() ? (snap.data() as WorkoutLog) : null;
}

export async function getRecentLogs(uid: string, count = 10): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WorkoutLog);
}

export async function getLogsForHeatmap(uid: string, startDate: string): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid),
    where('date', '>=', startDate),
    orderBy('date', 'asc')
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
