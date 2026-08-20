import { WorkoutLog, ExerciseCategory } from '../types/workout';
import { UserProfile } from '../types/user';
import { computePRs } from '../services/prService';
import { logMinutes } from './energy';
import { daysAgoString } from './date';
import { CATEGORY_LABELS } from '../constants/exercises';

// Single source of truth for "how many exercise categories exist" so the
// 'variety' ladder below never drifts from CATEGORY_LABELS again (it did:
// 'sport' was added in v2.16.0 but this file kept hardcoding a max of 6).
const TOTAL_CATEGORIES = Object.keys(CATEGORY_LABELS).length;

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  current: number;
  target: number;
  tier: number;
  group: string;
}

interface GroupDef {
  group: string;
  icon: string;
  thresholds: number[];
  title: (n: number) => string;
  desc: (n: number) => string;
}

// Milestone ladders per group. Each threshold in a ladder becomes one
// Achievement row; `tier` is the threshold's index within its ladder.
const GROUPS: GroupDef[] = [
  {
    group: 'streak',
    icon: '🔥',
    thresholds: [3, 7, 14, 30, 60, 100],
    title: (n) => `Chuỗi ${n} ngày`,
    desc: (n) => `Tập liên tục ${n} ngày không nghỉ`,
  },
  {
    group: 'sessions',
    icon: '🏋️',
    thresholds: [1, 10, 25, 50, 100, 250],
    title: (n) => `${n} buổi tập`,
    desc: (n) => `Hoàn thành ${n} buổi tập`,
  },
  {
    group: 'minutes',
    icon: '⏱️',
    thresholds: [60, 300, 600, 1500, 3000],
    title: (n) => `${n} phút luyện tập`,
    desc: (n) => `Tích lũy ${n} phút luyện tập`,
  },
  {
    group: 'pr',
    icon: '🏆',
    thresholds: [1, 5, 10, 25],
    title: (n) => `${n} kỷ lục cá nhân`,
    desc: (n) => `Phá ${n} kỷ lục cá nhân`,
  },
  {
    group: 'consistency',
    icon: '📅',
    thresholds: [10, 20, 30],
    title: (n) => `${n} ngày/tháng đều đặn`,
    desc: (n) => `Tập ${n} ngày trong 30 ngày qua`,
  },
  {
    group: 'variety',
    icon: '🧩',
    thresholds: Array.from({ length: TOTAL_CATEGORIES - 2 }, (_, i) => i + 3),
    title: (n) => `Tập ${n}/${TOTAL_CATEGORIES} nhóm cơ`,
    desc: (n) => `Đã luyện tập ${n}/${TOTAL_CATEGORIES} nhóm bài tập khác nhau`,
  },
  {
    group: 'dumbbell_sessions',
    icon: '🏋️‍♂️',
    thresholds: [1, 5, 15, 30, 60],
    title: (n) => `${n} buổi tạ đơn`,
    desc: (n) => `Tập với tạ đơn tại nhà ${n} buổi`,
  },
];

// Current progress value for a group, computed from data already available
// elsewhere in the app (StatsPage's KPI header, prService, energy.ts).
function currentValueFor(group: string, logs: WorkoutLog[], profile: UserProfile | null): number {
  switch (group) {
    case 'streak':
      return profile?.streak?.longest ?? 0;

    case 'sessions':
      return logs.length;

    case 'minutes': {
      const fromLogs = logs.reduce((sum, l) => sum + (l.totalDurationMinutes || 0), 0);
      if (fromLogs > 0) return Math.round(fromLogs);
      // Fall back to estimating minutes per-log when totalDurationMinutes
      // wasn't persisted (older logs / edge cases) — mirrors StatsPage.
      return Math.round(logs.reduce((sum, l) => sum + logMinutes(l), 0));
    }

    case 'pr':
      return computePRs(logs).length;

    case 'consistency': {
      const cutoff = daysAgoString(30);
      const days = new Set(
        logs.filter((l) => (l.date || '') >= cutoff).map((l) => l.date)
      );
      return days.size;
    }

    case 'variety': {
      const categories = new Set<ExerciseCategory>();
      logs.forEach((l) => l.exercises.forEach((e) => categories.add(e.category)));
      return categories.size;
    }

    case 'dumbbell_sessions':
      return logs.filter((l) => l.exercises.some((e) => e.category === 'dumbbell')).length;

    default:
      return 0;
  }
}

// Computes every milestone achievement (unlocked and locked) from logs +
// profile. Stateless — nothing is persisted, everything is derived fresh
// from existing data each render. Rows come back grouped by `group`, tiers
// in ascending order, so within a group unlocked rows (lower thresholds)
// naturally precede locked ones (higher thresholds).
export function computeAchievements(logs: WorkoutLog[], profile: UserProfile | null): Achievement[] {
  const result: Achievement[] = [];

  for (const g of GROUPS) {
    const current = currentValueFor(g.group, logs, profile);
    g.thresholds.forEach((target, tier) => {
      result.push({
        id: `${g.group}-${target}`,
        icon: g.icon,
        title: g.title(target),
        desc: g.desc(target),
        unlocked: current >= target,
        current,
        target,
        tier,
        group: g.group,
      });
    });
  }

  return result;
}
