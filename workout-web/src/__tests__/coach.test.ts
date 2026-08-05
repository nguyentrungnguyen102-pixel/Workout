import { describe, it, expect } from 'vitest';
import { buildFitnessAssessment, levelForScore, AssessmentPeriod } from '../lib/coach';
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

// Like makeLog but with an arbitrary set of exercises, for strength-scoring
// tests that need more than 1 exercise per log.
function makeMultiLog(
  daysAgo: number,
  exercises: { presetId: string; name: string; unit: 'reps' | 'seconds'; reps?: number; durationSeconds?: number }[]
): WorkoutLog {
  return {
    id: `multi-${daysAgo}`,
    userId: 'test-user',
    date: daysAgoString(daysAgo),
    exercises: exercises.map((e) => ({ ...e, category: 'strength', sets: 3 })),
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
  } as unknown as WorkoutLog;
}

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
      prevStart: daysAgoString(13),
      prevEnd: daysAgoString(7),
    };
    const periodLong: AssessmentPeriod = {
      logs: allLogs,
      prevLogs: [],
      label: '90 ngày',
      days: 90,
      prevDays: 90,
      start: daysAgoString(89),
      end: daysAgoString(0),
      prevStart: daysAgoString(179),
      prevEnd: daysAgoString(90),
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

  it('pins the overall tier boundaries at 40/60/80 (score < 40 upper-exclusive)', () => {
    expect(levelForScore(39).level).toBe('Nhập môn');
    expect(levelForScore(40).level).toBe('Nghiệp dư');
    expect(levelForScore(59).level).toBe('Nghiệp dư');
    expect(levelForScore(60).level).toBe('Bán chuyên');
    expect(levelForScore(79).level).toBe('Bán chuyên');
    expect(levelForScore(80).level).toBe('Chuyên nghiệp');
  });

  it('keeps strength/body weights identical across a 7-day and a 90-day period (they are not period-scoped)', () => {
    const period7: AssessmentPeriod = {
      logs: allLogs.filter((l) => l.date >= daysAgoString(6)),
      prevLogs: allLogs.filter((l) => l.date >= daysAgoString(13) && l.date < daysAgoString(6)),
      label: '7 ngày',
      days: 7,
      prevDays: 7,
      start: daysAgoString(6),
      end: daysAgoString(0),
      prevStart: daysAgoString(13),
      prevEnd: daysAgoString(7),
    };
    const period90: AssessmentPeriod = {
      logs: allLogs,
      prevLogs: [],
      label: '90 ngày',
      days: 90,
      prevDays: 90,
      start: daysAgoString(89),
      end: daysAgoString(0),
      prevStart: daysAgoString(179),
      prevEnd: daysAgoString(90),
    };

    const assessment7 = buildFitnessAssessment(allLogs, mockProfile, 65, period7);
    const assessment90 = buildFitnessAssessment(allLogs, mockProfile, 65, period90);
    expect(assessment7).not.toBeNull();
    expect(assessment90).not.toBeNull();

    const strengthWeight7 = assessment7!.weights.find((w) => w.key === 'strength');
    const strengthWeight90 = assessment90!.weights.find((w) => w.key === 'strength');
    const bodyWeight7 = assessment7!.weights.find((w) => w.key === 'body');
    const bodyWeight90 = assessment90!.weights.find((w) => w.key === 'body');
    expect(strengthWeight7).toEqual(strengthWeight90);
    expect(bodyWeight7).toEqual(bodyWeight90);
  });

  it('reports prevScore === score when prevLogs mirrors logs over an equal-length window', () => {
    const sameLogs = allLogs.filter((l) => l.date >= daysAgoString(6));
    const period: AssessmentPeriod = {
      logs: sameLogs,
      prevLogs: sameLogs,
      label: '7 ngày',
      days: 7,
      prevDays: 7,
      start: daysAgoString(6),
      end: daysAgoString(0),
      prevStart: daysAgoString(6),
      prevEnd: daysAgoString(0),
    };
    const assessment = buildFitnessAssessment(allLogs, mockProfile, 65, period);
    expect(assessment).not.toBeNull();
    expect(assessment!.prevScore).toBe(assessment!.score);
    expect(assessment!.prevLevel).toBe(assessment!.level);
  });

  it('does not count a strength PR from outside the recent 90-day scoring window', () => {
    const oldOnly: WorkoutLog[] = [makeLog(120, 50)];
    const assessment = buildFitnessAssessment(oldOnly, mockProfile, 65);
    expect(assessment).not.toBeNull();
    const strength = findDim(assessment!, 'strength');
    expect(strength.tierLabel).toBe('Chưa đủ dữ liệu');
    expect(strength.valueText).toContain('90 ngày gần đây');
  });

  it('lists every matched exercise (not just the most-frequent one) when ≥2 standard-covered exercises were trained recently', () => {
    const logs: WorkoutLog[] = [
      makeMultiLog(2, [
        { presetId: 'pushup', name: 'Hít đất', unit: 'reps', reps: 30 },
        { presetId: 'situp', name: 'Gập bụng', unit: 'reps', reps: 40 },
      ]),
    ];
    const assessment = buildFitnessAssessment(logs, mockProfile, 65);
    expect(assessment).not.toBeNull();
    const strength = findDim(assessment!, 'strength');
    expect(strength.valueText).toContain('Hít đất');
    expect(strength.valueText).toContain('Gập bụng');
  });
});
