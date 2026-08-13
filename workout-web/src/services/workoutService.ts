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
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DraftWorkout, WorkoutLog, WorkoutPreset } from '../types/workout';
import { todayString, yesterdayString } from '../lib/date';
import { computeLogMetrics } from '../lib/logMetrics';

export async function logWorkout(
  uid: string,
  draft: DraftWorkout,
  weightKg?: number
): Promise<WorkoutLog> {
  if (draft.exercises.length === 0) throw new Error('No exercises');

  const metrics = computeLogMetrics(draft.exercises, draft.startedAt, draft.intensity, weightKg);

  // Each log call creates a new document (multiple logs per day supported)
  const logRef = doc(collection(db, 'logs'));
  const logData: Record<string, any> = {
    id: logRef.id,
    userId: uid,
    date: metrics.date,
    exercises: metrics.exercises,
    totalDurationMinutes: metrics.totalDurationMinutes,
    intensityScore: metrics.intensityScore,
    intensity: metrics.intensity,
    caloriesEstimate: metrics.caloriesEstimate,
    source: 'manual',
    syncedToSheets: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (draft.notes) logData.notes = draft.notes;
  if (draft.location) logData.location = draft.location;
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
    date: metrics.date,
    exercises: metrics.exercises,
    totalDurationMinutes: metrics.totalDurationMinutes,
    intensityScore: metrics.intensityScore,
    intensity: metrics.intensity,
    caloriesEstimate: metrics.caloriesEstimate,
    source: 'manual',
    syncedToSheets: false,
  };
}

// Edits an already-saved log in place (wrong reps typed, forgot an exercise,
// wrong date/time...) instead of leaving the user stuck with a bad entry or
// forced to delete + redo the whole thing. Recomputes every derived field
// (date/duration/intensity/calories) the same way logWorkout() does via
// computeLogMetrics() so an edited log is indistinguishable from a fresh one.
// Does NOT touch preset usageCount/lastUsedAt or streak/PR bookkeeping — those
// were already applied once when the log was first created.
export async function updateWorkoutLog(
  logId: string,
  draft: DraftWorkout,
  weightKg?: number
): Promise<void> {
  if (draft.exercises.length === 0) throw new Error('No exercises');

  const metrics = computeLogMetrics(draft.exercises, draft.startedAt, draft.intensity, weightKg);

  await updateDoc(doc(db, 'logs', logId), {
    date: metrics.date,
    exercises: metrics.exercises,
    totalDurationMinutes: metrics.totalDurationMinutes,
    intensityScore: metrics.intensityScore,
    intensity: metrics.intensity,
    caloriesEstimate: metrics.caloriesEstimate,
    notes: draft.notes ? draft.notes : deleteField(),
    location: draft.location ? draft.location : deleteField(),
    startedAt: draft.startedAt ? Timestamp.fromDate(draft.startedAt) : deleteField(),
    updatedAt: serverTimestamp(),
  });
}

// Soft delete: Firestore Rules for `logs/{logId}` only grant `update`, not
// `delete` (see workout-tracker/firestore.rules — shared project), and a hard
// delete would need a rules change + manual deploy. Flagging `deleted: true`
// instead needs no rules change and every read function below already
// filters it out client-side (same "no server-side where on a
// maybe-missing field" reasoning as the date/orderBy notes above: an
// equality `where('deleted','==',false)` would silently exclude every log
// written before this field existed).
export async function softDeleteLog(logId: string): Promise<void> {
  await updateDoc(doc(db, 'logs', logId), { deleted: true, deletedAt: serverTimestamp() });
}

export async function restoreLog(logId: string): Promise<void> {
  await updateDoc(doc(db, 'logs', logId), { deleted: false, deletedAt: deleteField() });
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
    .filter((log) => !log.deleted)
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
    .filter((log) => !log.deleted && log.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildDraftFromLog(log: WorkoutLog): DraftWorkout {
  return {
    exercises: log.exercises.map((e) => ({ ...e })),
    startedAt: new Date(),
    intensity: log.intensity,
    notes: '',
    location: '',
  };
}

// Returns null for a soft-deleted log too — a stale deep link (bookmark,
// browser back button after deleting) should behave like the log is gone,
// not resurrect it in the detail view.
export async function getLogById(logId: string): Promise<WorkoutLog | null> {
  const snap = await getDoc(doc(db, 'logs', logId));
  if (!snap.exists()) return null;
  const log = snap.data() as WorkoutLog;
  return log.deleted ? null : log;
}

// Full unfiltered history for a user (data export/backup) — same
// no-orderBy/no-limit pattern as the rest of this file so a large history
// can't get silently truncated (see the getRecentLogs comment above).
export async function getAllLogs(uid: string): Promise<WorkoutLog[]> {
  const q = query(collection(db, 'logs'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => !log.deleted)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

export async function getLogsForExercise(uid: string, presetId: string): Promise<WorkoutLog[]> {
  const q = query(collection(db, 'logs'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => !log.deleted && log.exercises.some((e) => e.presetId === presetId))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getLogsForDate(uid: string, date: string): Promise<WorkoutLog[]> {
  const q = query(collection(db, 'logs'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as WorkoutLog)
    .filter((log) => !log.deleted && log.date === date)
    .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));
}
