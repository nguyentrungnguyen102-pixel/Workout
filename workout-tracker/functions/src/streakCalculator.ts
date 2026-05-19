export interface StreakDoc {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  streakStartDate: string;
  totalWorkoutDays: number;
  weeklyGoal: number;
  thisWeekCount: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

function isSameISOWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = (dt: Date) => {
    const d2 = new Date(dt);
    const day = d2.getDay() || 7;
    d2.setDate(d2.getDate() - day + 1);
    d2.setHours(0, 0, 0, 0);
    return d2;
  };
  return startOfWeek(d).getTime() === startOfWeek(now).getTime();
}

export function calculateStreak(
  existing: StreakDoc | null,
  newDate: string
): StreakDoc {
  if (!existing) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: newDate,
      streakStartDate: newDate,
      totalWorkoutDays: 1,
      weeklyGoal: 4,
      thisWeekCount: 1,
    };
  }

  const diff = daysBetween(existing.lastWorkoutDate, newDate);

  let { currentStreak, streakStartDate, longestStreak } = existing;

  if (diff === 0) {
    // Same day re-log, no change
  } else if (diff === 1) {
    currentStreak += 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  } else {
    // Streak broken
    currentStreak = 1;
    streakStartDate = newDate;
  }

  const thisWeekCount = isSameISOWeek(newDate)
    ? existing.thisWeekCount + (diff > 0 ? 1 : 0)
    : 1;

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: newDate,
    streakStartDate,
    totalWorkoutDays: existing.totalWorkoutDays + (diff > 0 ? 1 : 0),
    weeklyGoal: existing.weeklyGoal,
    thisWeekCount,
  };
}
