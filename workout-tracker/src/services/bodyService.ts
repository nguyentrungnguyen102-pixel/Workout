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
  const ref = await addDoc(collection(db, 'bodyMetrics'), {
    ...data,
    userId: uid,
    date: todayString(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getBodyMetrics(uid: string, count = 30): Promise<BodyMetric[]> {
  const q = query(
    collection(db, 'bodyMetrics'),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BodyMetric));
}

export async function getLatestBodyMetric(uid: string): Promise<BodyMetric | null> {
  const metrics = await getBodyMetrics(uid, 1);
  return metrics[0] || null;
}
