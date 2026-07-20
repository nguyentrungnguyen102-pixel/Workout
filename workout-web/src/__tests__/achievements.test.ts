import { describe, it, expect } from 'vitest';
import { computeAchievements } from '../lib/achievements';
import { daysAgoString } from '../lib/date';
import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';

// Minimal, type-correct mock WorkoutLog. `weight` lets tests exercise the PR
// (weight-based) and dumbbell-category paths too.
function makeLog(daysAgo: number, opts: { presetId?: string; category?: string; reps?: number; weight?: number } = {}): WorkoutLog {
  const { presetId = 'pushup', category = 'strength', reps = 10, weight } = opts;
  return {
    id: `log-${daysAgo}-${presetId}`,
    userId: 'test-user',
    date: daysAgoString(daysAgo),
    exercises: [
      { presetId, name: presetId, category, unit: 'reps', sets: 3, reps, weight },
    ],
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  } as unknown as WorkoutLog;
}

function makeProfile(streakLongest: number): UserProfile {
  return {
    uid: 'test-user',
    displayName: 'Test User',
    email: 'test@example.com',
    timezone: 'Asia/Ho_Chi_Minh',
    weeklyGoalMinutes: 150,
    weeklyGoalSessions: 3,
    streak: { current: 0, longest: streakLongest, lastWorkoutDate: '', streakStartDate: '' },
    weeklyStats: { weekStartDate: '', totalMinutes: 0, targetMinutes: 150, sessionCount: 0 },
    onboardingDone: true,
  } as unknown as UserProfile;
}

function find(achievements: ReturnType<typeof computeAchievements>, group: string, target: number) {
  const a = achievements.find((x) => x.group === group && x.target === target);
  if (!a) throw new Error(`achievement ${group}/${target} not found`);
  return a;
}

describe('computeAchievements', () => {
  it('unlocks the sessions-10 tier but not sessions-25 with 12 logged sessions', () => {
    const logs = Array.from({ length: 12 }, (_, i) => makeLog(i));
    const achievements = computeAchievements(logs, makeProfile(0));

    expect(find(achievements, 'sessions', 10).unlocked).toBe(true);
    expect(find(achievements, 'sessions', 25).unlocked).toBe(false);
    expect(find(achievements, 'sessions', 10).current).toBe(12);
  });

  it('unlocks streak-7 but not streak-14 when profile.streak.longest = 8', () => {
    const logs = [makeLog(0)];
    const achievements = computeAchievements(logs, makeProfile(8));

    expect(find(achievements, 'streak', 7).unlocked).toBe(true);
    expect(find(achievements, 'streak', 14).unlocked).toBe(false);
    expect(find(achievements, 'streak', 7).current).toBe(8);
  });

  it('computes consistency current as unique training days within the last 30 days', () => {
    // 5 distinct days inside the 30-day window, plus one far outside it.
    const logs = [
      makeLog(1), makeLog(2), makeLog(3), makeLog(4), makeLog(5),
      makeLog(60),
    ];
    const achievements = computeAchievements(logs, makeProfile(0));

    expect(find(achievements, 'consistency', 10).current).toBe(5);
    expect(find(achievements, 'consistency', 10).unlocked).toBe(false);
  });

  it('computes variety current as the count of distinct exercise categories trained', () => {
    const logs = [
      makeLog(0, { presetId: 'pushup', category: 'strength' }),
      makeLog(1, { presetId: 'plank', category: 'core' }),
      makeLog(2, { presetId: 'running', category: 'cardio' }),
    ];
    const achievements = computeAchievements(logs, makeProfile(0));

    expect(find(achievements, 'variety', 3).unlocked).toBe(true);
    expect(find(achievements, 'variety', 4).unlocked).toBe(false);
  });

  it('counts PRs via prService.computePRs for the pr group', () => {
    const logs = [
      makeLog(2, { presetId: 'db_bicep_curl', category: 'dumbbell', reps: 8, weight: 5 }),
      makeLog(1, { presetId: 'db_bicep_curl', category: 'dumbbell', reps: 10, weight: 7.5 }),
    ];
    const achievements = computeAchievements(logs, makeProfile(0));

    // computePRs tracks one PR row per distinct presetId ever logged.
    expect(find(achievements, 'pr', 1).unlocked).toBe(true);
    expect(find(achievements, 'pr', 5).unlocked).toBe(false);
  });

  it('returns at least one unlocked achievement for an active user', () => {
    const logs = Array.from({ length: 12 }, (_, i) => makeLog(i));
    const achievements = computeAchievements(logs, makeProfile(8));

    expect(achievements.filter((a) => a.unlocked).length).toBeGreaterThan(0);
  });

  it('returns no unlocked achievements for an empty history', () => {
    const achievements = computeAchievements([], makeProfile(0));
    expect(achievements.filter((a) => a.unlocked).length).toBe(0);
  });
});
