import * as schedulerFunctions from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { buildSmartMessage } from './notificationBuilder';
import { StreakDoc } from './streakCalculator';

const db = admin.firestore();
const logger = schedulerFunctions.logger;

function getLocalHHMM(utcDate: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(utcDate)
      .replace(/[^\d:]/g, '');
  } catch {
    return '00:00';
  }
}

function isWithinWindow(current: string, target: string, windowMins = 5): boolean {
  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  return Math.abs(toMins(current) - toMins(target)) <= windowMins;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const sendSmartReminders = schedulerFunctions.onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'UTC' },
  async () => {
    const now = new Date();
    const today = toLocalDateString(now);

    const usersSnap = await db
      .collection('users')
      .where('reminderEnabled', '==', true)
      .get();

    const sends: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as {
        uid: string;
        fcmToken?: string;
        reminderTime?: string;
        timezone?: string;
      };

      if (!user.fcmToken || !user.reminderTime) continue;

      const tz = user.timezone || 'Asia/Ho_Chi_Minh';
      const localHHMM = getLocalHHMM(now, tz);

      if (!isWithinWindow(localHHMM, user.reminderTime)) continue;

      sends.push(sendToUser(userDoc.id, user.fcmToken, today));
    }

    await Promise.allSettled(sends);
    logger.info(`Processed ${sends.length} reminder candidates`);
  }
);

async function sendToUser(uid: string, fcmToken: string, today: string): Promise<void> {
  // Check if already logged today
  const logSnap = await db
    .collection('logs')
    .where('userId', '==', uid)
    .where('date', '==', today)
    .limit(1)
    .get();

  if (!logSnap.empty) return; // Already trained today

  const streakSnap = await db.doc(`streaks/${uid}`).get();
  const streak = streakSnap.exists()
    ? (streakSnap.data() as StreakDoc)
    : { currentStreak: 0, weeklyGoal: 4, thisWeekCount: 0 };

  const message = buildSmartMessage({
    currentStreak: streak.currentStreak,
    weeklyGoal: streak.weeklyGoal,
    thisWeekCount: streak.thisWeekCount,
  });

  if (!message) return;

  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: '💪 Nhắc nhở tập luyện',
      body: message,
    },
    data: { screen: 'QuickAdd' },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
    android: {
      notification: { sound: 'default', channelId: 'workout_reminders' },
    },
  });
}
