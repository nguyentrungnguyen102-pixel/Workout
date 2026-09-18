import { WorkoutLog } from '../types/workout';
import { addDaysString } from './date';

// "Nghỉ ngơi thông minh" — nudges toward a rest day after a long unbroken
// training streak, the same overtraining-prevention signal top fitness apps
// (Strava, Whoop, Garmin) surface as "recovery". Computed directly from
// logged dates rather than the stored profile.streak.current: that field is
// only refreshed when a NEW log is saved, so after several real rest days it
// would still read the old high streak (stale) until the next log resets
// it — showing a "you're overtraining" nudge to someone who already rested.
export type RecoveryLevel = 'consider' | 'strong';

export interface RecoveryInsight {
  level: RecoveryLevel;
  streakDays: number;
  message: string;
}

const CONSIDER_REST_AT = 6;
const STRONG_REST_AT = 9;

// Consecutive trained days ending today or yesterday — a streak with no
// activity for 2+ days reads as 0 (it's over, not a live overtraining risk).
// `logs` only needs a `date` field per entry; the 35-day window the Home
// page already loads is plenty since both thresholds above are well under it.
export function currentConsecutiveDays(logs: WorkoutLog[], todayStr: string): number {
  const trainedDates = new Set(logs.filter((l) => l.date).map((l) => l.date));
  const yesterdayStr = addDaysString(todayStr, -1);
  if (!trainedDates.has(todayStr) && !trainedDates.has(yesterdayStr)) return 0;

  let cursor = trainedDates.has(todayStr) ? todayStr : yesterdayStr;
  let count = 0;
  while (trainedDates.has(cursor)) {
    count++;
    cursor = addDaysString(cursor, -1);
  }
  return count;
}

export function buildRecoveryInsight(logs: WorkoutLog[], todayStr: string): RecoveryInsight | null {
  const streakDays = currentConsecutiveDays(logs, todayStr);
  if (streakDays < CONSIDER_REST_AT) return null;

  const level: RecoveryLevel = streakDays >= STRONG_REST_AT ? 'strong' : 'consider';
  const message =
    level === 'strong'
      ? `Đã tập ${streakDays} ngày liên tiếp — nên nghỉ hẳn hôm nay để cơ phục hồi, tránh chấn thương do quá tải.`
      : `Đã tập ${streakDays} ngày liên tiếp — cân nhắc nghỉ 1 hôm hoặc tập nhẹ (giãn cơ/đi bộ) để cơ phục hồi.`;

  return { level, streakDays, message };
}
