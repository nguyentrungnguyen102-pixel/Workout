import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DraftWorkout, WorkoutLog, WorkoutPreset, Intensity } from '../types/workout';
import { todayString, yesterdayString } from '../lib/date';
import { exerciseMinutes, logKcal } from '../lib/energy';

function deriveIntensity(exercises: WorkoutLog['exercises']): { intensity: Intensity; score: number } {
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  if (totalSets >= 12) return { intensity: 'heavy', score: 8 };
  if (totalSets >= 6) return { intensity: 'moderate', score: 5 };
  return { intensity: 'light', score: 3 };
}

export async function logWorkout(
  uid: string,
  draft: DraftWorkout,
  weightKg?: number
): Promise<WorkoutLog> {
  if (draft.exercises.length === 0) throw new Error('No exercises');

  // Date is derived from the (possibly back-dated) startedAt so the log lands
  // on the correct calendar day when the user forgot to record in realtime.
  const when = draft.startedAt ?? new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;

  // Always sum exercise times — elapsed-since-start is meaningless once the
  // user can back-date startedAt. Minutes/calories now come from the
  // MET-based model in lib/energy.ts (see there for sourcing) instead of the
  // old flat "reps = 3 min, kcal = minutes * 7" guesses.
  const totalDurationMinutes = Math.max(
    1,
    Math.round(draft.exercises.reduce((sum, e) => sum + exerciseMinutes(e), 0))
  );

  const { intensity, score } = deriveIntensity(draft.exercises);
  // weightKg may be unknown (undefined -> 0): logKcal() falls back to
  // DEFAULT_WEIGHT_KG in that case since this is a brand-new log with no
  // prior caloriesEstimate to fall back to instead.
  const caloriesEstimate = logKcal(
    { exercises: draft.exercises } as WorkoutLog,
    weightKg ?? 0
  );

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

  return {
    id: logRef.id,
    userId: uid,
    date,
    exercises: draft.exercises,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    intensityScore: score,
    intensity: draft.intensity || intensity,
    caloriesEstimate,
    source: 'manual',
    syncedToSheets: false,
  };
}

// ⚠️ Server-side orderBy/date-range is intentionally NOT used in the queries
// below: orderBy('date') silently DROPS any log document missing the `date`
// field, and range+orderBy shapes require composite indexes that are not
// guaranteed to exist on the live project — both failure modes make the app
// look like all data was lost. Only reintroduce after deploying
// firestore.indexes.json AND verifying every historical log has `date`.
//
// ⚠️ No `limit()` either: a query with `where('userId'...)` but no `orderBy`
// returns docs in Firestore's default (document-path) order, which has no
// relation to `date`/recency. A hard `limit()` on top of that would hand back
// an arbitrary slice of the user's whole history once their log count passed
// the cap — possibly excluding today's just-saved log — then every client-side
// date filter/sort below would silently operate on that incomplete slice.
// Fetching the full per-user collection and filtering/sorting client-side is
// the only way to keep results deterministic without reintroducing orderBy.
export async function getRecentLogs(uid: string, count = 10): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .sort((a, b) => {
      const d = (b.date || '').localeCompare(a.date || '');
      return d !== 0 ? d : (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now());
    })
    .slice(0, count);
}

export async function getLogsForHeatmap(uid: string, startDate: string): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => log.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date));
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
  const q = query(collection(db, 'logs'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => log.exercises.some((e) => e.presetId === presetId))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getLogsForDate(uid: string, date: string): Promise<WorkoutLog[]> {
  const q = query(collection(db, 'logs'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => log.date === date)
    .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));
}
