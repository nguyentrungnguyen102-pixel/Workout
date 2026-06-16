import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutPreset, ExerciseCategory, ExerciseUnit } from '../types/workout';

export async function getCustomPresets(uid: string): Promise<WorkoutPreset[]> {
  // Single where clause only — avoids composite index; sort client-side
  const q = query(
    collection(db, 'workouts'),
    where('userId', '==', uid),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as WorkoutPreset))
    .filter((p) => p.isCustom)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
}

export async function saveCustomPreset(
  uid: string,
  data: {
    nameVi: string;
    category: ExerciseCategory;
    unit: ExerciseUnit;
    defaultValue: number;
    defaultSets: number;
    icon: string;
  }
): Promise<WorkoutPreset> {
  const ref = await addDoc(collection(db, 'workouts'), {
    name: data.nameVi,
    nameVi: data.nameVi,
    category: data.category,
    unit: data.unit,
    defaultValue: data.defaultValue,
    defaultSets: data.defaultSets,
    icon: data.icon,
    isCustom: true,
    userId: uid,
    usageCount: 0,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    name: data.nameVi,
    nameVi: data.nameVi,
    category: data.category,
    unit: data.unit,
    defaultValue: data.defaultValue,
    defaultSets: data.defaultSets,
    icon: data.icon,
    isCustom: true,
    userId: uid,
    usageCount: 0,
  };
}

export async function deleteCustomPreset(presetId: string): Promise<void> {
  await deleteDoc(doc(db, 'workouts', presetId));
}
