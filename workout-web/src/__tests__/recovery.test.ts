import { describe, it, expect } from 'vitest';
import { buildRecoveryInsight, currentConsecutiveDays } from '../lib/recovery';
import { daysAgoString } from '../lib/date';
import { WorkoutLog } from '../types/workout';

function makeLog(daysAgo: number): WorkoutLog {
  return {
    id: `log-${daysAgo}`,
    userId: 'test-user',
    date: daysAgoString(daysAgo),
    exercises: [{ presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 }],
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  } as unknown as WorkoutLog;
}

// Logs for the last N days counting back from (and including) today.
function trainedLastNDays(n: number): WorkoutLog[] {
  return Array.from({ length: n }, (_, i) => makeLog(i));
}

const today = daysAgoString(0);

describe('currentConsecutiveDays', () => {
  it('returns 0 for no logs', () => {
    expect(currentConsecutiveDays([], today)).toBe(0);
  });

  it('counts an unbroken streak ending today', () => {
    expect(currentConsecutiveDays(trainedLastNDays(5), today)).toBe(5);
  });

  it('counts an unbroken streak ending yesterday (today not logged yet)', () => {
    const logs = [makeLog(1), makeLog(2), makeLog(3)];
    expect(currentConsecutiveDays(logs, today)).toBe(3);
  });

  it('returns 0 when the most recent log is 2+ days old (streak already broken)', () => {
    const logs = [makeLog(2), makeLog(3), makeLog(4)];
    expect(currentConsecutiveDays(logs, today)).toBe(0);
  });

  it('stops counting at the first gap', () => {
    // Trained today, yesterday, then a gap before day 4/5.
    const logs = [makeLog(0), makeLog(1), makeLog(4), makeLog(5)];
    expect(currentConsecutiveDays(logs, today)).toBe(2);
  });

  it('dedupes multiple logs on the same day', () => {
    const logs = [makeLog(0), makeLog(0), makeLog(1)];
    expect(currentConsecutiveDays(logs, today)).toBe(2);
  });
});

describe('buildRecoveryInsight', () => {
  it('returns null when there is no streak', () => {
    expect(buildRecoveryInsight([], today)).toBeNull();
  });

  it('returns null below the "consider" threshold', () => {
    expect(buildRecoveryInsight(trainedLastNDays(5), today)).toBeNull();
  });

  it('returns "consider" at the threshold', () => {
    const insight = buildRecoveryInsight(trainedLastNDays(6), today);
    expect(insight).not.toBeNull();
    expect(insight?.level).toBe('consider');
    expect(insight?.streakDays).toBe(6);
    expect(insight?.message).toContain('6 ngày liên tiếp');
  });

  it('stays "consider" just below the "strong" threshold', () => {
    const insight = buildRecoveryInsight(trainedLastNDays(8), today);
    expect(insight?.level).toBe('consider');
  });

  it('escalates to "strong" at the strong threshold', () => {
    const insight = buildRecoveryInsight(trainedLastNDays(9), today);
    expect(insight?.level).toBe('strong');
    expect(insight?.streakDays).toBe(9);
  });

  it('returns null once the streak is stale (2+ rest days already taken)', () => {
    const logs = [makeLog(2), makeLog(3), makeLog(4), makeLog(5), makeLog(6), makeLog(7)];
    expect(buildRecoveryInsight(logs, today)).toBeNull();
  });
});
