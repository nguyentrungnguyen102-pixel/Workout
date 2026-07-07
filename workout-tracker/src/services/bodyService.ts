import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
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

export async function getBodyMetrics(uid: string, count = 30): Promise<BodyMetric[]> {
  // orderBy('date', 'desc') must come before limit() — without it Firestore
  // orders by document ID (random, since addDoc generates an auto-ID), so the
  // 100-doc window can silently drop the most recent entries once a user
  // passes 100 total measurements.
  const q = query(
    collection(db, 'bodyMetrics'),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(100)
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
