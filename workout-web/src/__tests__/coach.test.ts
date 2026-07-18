import { describe, it, expect } from 'vitest';
import { buildFitnessAssessment, AssessmentPeriod } from '../lib/coach';
import { daysAgoString } from '../lib/date';
import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';

// Builds a minimal, type-correct mock WorkoutLog with one pushup exercise.
// `daysAgo` uses the same local-date helper the app uses elsewhere (lib/date)
// so dates line up with how buildFitnessAssessment computes period cutoffs.
function makeLog(daysAgo: number, reps: number): WorkoutLog {
  return {
    id: `log-${daysAgo}`,
    userId: 'test-user',
    date: daysAgoString(daysAgo),
    exercises: [
      { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps },
    ],
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  } as unknown as WorkoutLog;
}

const mockProfile: UserProfile = {
  uid: 'test-user',
  displayName: 'Test User',
  email: 'test@example.com',
  timezone: 'Asia/Ho_Chi_Minh',
  weeklyGoalMinutes: 150,
  weeklyGoalSessions: 3,
  streak: { current: 0, longest: 0, lastWorkoutDate: '', streakStartDate: '' },
  weeklyStats: { weekStartDate: '', totalMinutes: 0, targetMinutes: 150, sessionCount: 0 },
  onboardingDone: true,
  sex: 'male',
  birthYear: 1990,
  heightCm: 170,
};

// 30 logs spread every 3 days over the last ~90 days, reps escalating
// slightly toward "today" so there's at least one recent PR (progression
// dimension has real data) as well as plenty of older history.
const allLogs: WorkoutLog[] = Array.from({ length: 30 }, (_, i) => {
  const daysAgo = i * 3;
  const reps = daysAgo === 0 ? 35 : 18 + (i % 5);
  return makeLog(daysAgo, reps);
});

function findDim(assessment: NonNullable<ReturnType<typeof buildFitnessAssessment>>, key: string) {
  const dim = assessment.dimensions.find((d) => d.key === key);
  if (!dim) throw new Error(`dimension ${key} not found`);
  return dim;
}

describe('buildFitnessAssessment', () => {
  it('shows a real body/BMI dimension when a bodyweight is supplied (guards BMI-blank regression)', () => {
    const assessment = buildFitnessAssessment(allLogs, mockProfile, 65);
    expect(assessment).not.toBeNull();
    const body = findDim(assessment!, 'body');
    expect(body.tierLabel).not.toBe('Cần hồ sơ');
  });

  it('activity/consistency dimensions follow the selected period, not a fixed window (guards period-filter regression)', () => {
    const periodShort: AssessmentPeriod = {
      logs: allLogs.filter((l) => l.date >= daysAgoString(6)),
      prevLogs: allLogs.filter((l) => l.date >= daysAgoString(13) && l.date < daysAgoString(6)),
      label: '7 ngày',
      days: 7,
      prevDays: 7,
      start: daysAgoString(6),
      end: daysAgoString(0),
    };
    const periodLong: AssessmentPeriod = {
      logs: allLogs,
      prevLogs: [],
      label: '90 ngày',
      days: 90,
      prevDays: 90,
      start: daysAgoString(89),
      end: daysAgoString(0),
    };

    const assessmentShort = buildFitnessAssessment(allLogs, mockProfile, 65, periodShort);
    const assessmentLong = buildFitnessAssessment(allLogs, mockProfile, 65, periodLong);
    expect(assessmentShort).not.toBeNull();
    expect(assessmentLong).not.toBeNull();

    const activityShort = findDim(assessmentShort!, 'activity');
    const activityLong = findDim(assessmentLong!, 'activity');
    expect(activityShort.value).not.toBe(activityLong.value);

    const consistencyShort = findDim(assessmentShort!, 'consistency');
    const consistencyLong = findDim(assessmentLong!, 'consistency');
    expect(consistencyShort.value).not.toBe(consistencyLong.value);
  });

  it('flags needsProfile when sex is missing', () => {
    const incompleteProfile: UserProfile = { ...mockProfile, sex: undefined };
    const assessment = buildFitnessAssessment(allLogs, incompleteProfile, 65);
    expect(assessment).not.toBeNull();
    expect(assessment!.needsProfile).toBe(true);
  });
});
