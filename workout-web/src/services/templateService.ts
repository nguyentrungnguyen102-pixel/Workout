import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutTemplate, ExerciseEntry } from '../types/workout';

export async function saveTemplate(
  uid: string,
  name: string,
  exercises: ExerciseEntry[]
): Promise<WorkoutTemplate> {
  const ref = doc(collection(db, 'templates'));
  const cleanExercises = exercises.map((e) => {
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

  const data: Record<string, any> = {
    id: ref.id,
    userId: uid,
    name: name.trim(),
    exercises: cleanExercises,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { id: ref.id, userId: uid, name: name.trim(), exercises: cleanExercises as ExerciseEntry[] };
}

export async function getTemplates(uid: string): Promise<WorkoutTemplate[]> {
  const q = query(collection(db, 'templates'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d: import('firebase/firestore').QueryDocumentSnapshot) => d.data() as WorkoutTemplate)
    .sort((a: WorkoutTemplate, b: WorkoutTemplate) =>
      ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0)
    );
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, 'templates', templateId));
}
