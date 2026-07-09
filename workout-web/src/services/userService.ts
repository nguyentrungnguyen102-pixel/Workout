import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserStreak } from '../types/user';
import { todayString, yesterdayString, daysBetween } from '../lib/date';

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createOrUpdateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...data, uid }, { merge: true });
}

export async function updateStreakAfterLog(uid: string): Promise<void> {
  const today = todayString();
  const yesterday = yesterdayString();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;

  const user = snap.data() as UserProfile;
  const streak = user.streak;
  const lastDate = streak?.lastWorkoutDate;

  let newCurrent = 1;
  let newLongest = streak?.longest || 1;
  let newStartDate = today;

  if (lastDate === today) {
    // Already logged today — no change
    return;
  } else if (lastDate === yesterday) {
    // Consecutive day
    newCurrent = (streak?.current || 0) + 1;
    newStartDate = streak?.streakStartDate || today;
    if (newCurrent > newLongest) newLongest = newCurrent;
  }

  const weekStart = getMondayOfCurrentWeek();
  const isNewWeek = user.weeklyStats?.weekStartDate !== weekStart;

  await updateDoc(doc(db, 'users', uid), {
    'streak.current': newCurrent,
    'streak.longest': newLongest,
    'streak.lastWorkoutDate': today,
    'streak.streakStartDate': newStartDate,
    'streak.updatedAt': serverTimestamp(),
    'weeklyStats.weekStartDate': weekStart,
    'weeklyStats.sessionCount': isNewWeek ? 1 : increment(1),
    'weeklyStats.totalMinutes': isNewWeek ? 0 : increment(0),
    'weeklyStats.targetMinutes': user.weeklyGoalMinutes || 150,
  });
}

export async function updateWeeklyMinutes(uid: string, minutes: number): Promise<void> {
  const weekStart = getMondayOfCurrentWeek();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const user = snap.data() as UserProfile;
  const isNewWeek = user.weeklyStats?.weekStartDate !== weekStart;

  await updateDoc(doc(db, 'users', uid), {
    'weeklyStats.totalMinutes': isNewWeek ? minutes : increment(minutes),
    'weeklyStats.weekStartDate': weekStart,
  });
}

