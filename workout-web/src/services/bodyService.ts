import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { BodyMetric } from '../types/body';
import { todayString } from '../lib/date';

export async function addBodyMetric(
  uid: string,
  data: Omit<BodyMetric, 'id' | 'userId' | 'date' | 'createdAt'>
): Promise<string> {
  const clean: Record<string, any> = { userId: uid, date: todayString(), createdAt: serverTimestamp() };
  if (data.weight !== undefined) clean.weight = data.weight;
  if (data.chestCm !== undefined) clean.chestCm = data.chestCm;
  if (data.hipCm !== undefined) clean.hipCm = data.hipCm;
  if (data.armCm !== undefined) clean.armCm = data.armCm;

  const ref = await addDoc(collection(db, 'bodyMetrics'), clean);
  return ref.id;
}

// No limit()/orderBy() — see workoutService.ts for why: an unordered
// limit() returns an arbitrary slice once a user's history exceeds the cap,
// which can silently drop the most recent weigh-in.
export async function getBodyMetrics(uid: string, count = 30): Promise<BodyMetric[]> {
  const q = query(
    collection(db, 'bodyMetrics'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as BodyMetric))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

export async function getLatestBodyMetric(uid: string): Promise<BodyMetric | null> {
  const metrics = await getBodyMetrics(uid, 1);
  return metrics[0] || null;
}
