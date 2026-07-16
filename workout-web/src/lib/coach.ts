import { WorkoutLog } from '../types/workout';
import { UserProfile, ExerciseGoal } from '../types/user';
import { estimateLogMinutes } from './weeklyPlan';
import { todayString, daysAgoString, daysBetween } from './date';
import { computePRs, getPRLabel } from '../services/prService';
import { CATEGORY_LABELS } from '../constants/exercises';

const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function shortDateVi(dateStr: string): string {
  // dd/mm from a YYYY-MM-DD string, defensively (no Date parsing needed).
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

// Raw reps / durationSeconds for one goal's presetId, summed across `logs` —
// same convention as computeGoalItem in lib/weeklyPlan.ts and getWeeklyGoal
// in pages/QuickAddPage.tsx (raw reps, not sets×reps; not imported from
// either file since both are being edited concurrently by someone else).
function sumGoalValue(goal: ExerciseGoal, logs: WorkoutLog[]): number {
  let sum = 0;
  for (const l of logs) {
    for (const ex of l.exercises || []) {
      if (ex.presetId !== goal.presetId) continue;
      if (goal.targetReps) sum += ex.reps || 0;
      else if (goal.targetDurationSeconds) sum += ex.durationSeconds || 0;
    }
  }
  return sum;
}

function formatGoalCount(goal: ExerciseGoal, value: number): { n: number; unit: string } {
  if (goal.targetReps) return { n: value, unit: 'cái' };
  const target = goal.targetDurationSeconds || 0;
  if (target >= 60) return { n: Math.round(value / 60), unit: 'phút' };
  return { n: value, unit: 's' };
}

// Builds 3-5 short Vietnamese coaching sentences, each backed by a concrete
// number, in a fixed priority order. Any step without enough data is simply
// omitted (never fabricated). Returns [] when there's no history at all —
// callers (CoachInsights) hide the card in that case.
export function buildCoachInsights(
  allLogs: WorkoutLog[],
  periodLogs: WorkoutLog[],
  prevPeriodLogs: WorkoutLog[],
  profile: UserProfile | null,
  periodLabel: string,
  periodDays: number,
  prevPeriodDays: number
): string[] {
  if (allLogs.length === 0) return [];

  const insights: string[] = [];

  // 1) Period trend: sessions + minutes vs previous period, prorated to the
  // current period's elapsed-day count — periodLogs can be a partial "period
  // to date" window (e.g. 3 days into the current week) while prevPeriodLogs
  // is always a full closed prior period, so comparing raw totals makes an
  // on-pace user look like they're falling behind on every day but the
  // period's last (callers pin prevPeriodDays === periodDays, a no-op ratio,
  // whenever both periods are already fully closed).
  {
    const sessions = periodLogs.length;
    const minutes = periodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0);
    const prevSessionsRaw = prevPeriodLogs.length;
    const prevMinutesRaw = prevPeriodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0);
    const prorate = Math.max(1, periodDays) / Math.max(1, prevPeriodDays);
    const prevSessions = Math.round(prevSessionsRaw * prorate);
    const prevMinutes = Math.round(prevMinutesRaw * prorate);

    if (prevSessionsRaw === 0 && prevMinutesRaw === 0) {
      insights.push(`📈 ${periodLabel}: ${sessions} buổi · ${minutes} phút — kỳ trước chưa tập`);
    } else {
      const sessDelta = sessions - prevSessions;
      const minDelta = minutes - prevMinutes;
      const trendUp = minDelta > 0 || (minDelta === 0 && sessDelta >= 0);
      const emoji = trendUp ? '📈' : '📉';
      // Each part's wording follows its OWN delta's sign — sessions and
      // minutes can trend in opposite directions (fewer, longer sessions),
      // and reusing the overall trend's verb for both would describe the
      // session-count change backwards in that case.
      const sessVerb = sessDelta > 0 ? 'hơn' : 'kém';
      const sessPart = sessDelta === 0 ? 'bằng kỳ trước về số buổi' : `${sessVerb} kỳ trước ${Math.abs(sessDelta)} buổi`;
      const minPart = `${minDelta >= 0 ? '+' : ''}${minDelta} phút`;
      insights.push(`${emoji} ${periodLabel}: ${sessions} buổi · ${minutes} phút — ${sessPart}, ${minPart}`);
    }
  }

  // 2) Muscle-group balance: top category share this period + neglected category.
  let neglected: { category: string; days: number } | null = null;
  {
    const catCount = new Map<string, number>();
    let totalCount = 0;
    for (const log of periodLogs) {
      for (const ex of log.exercises || []) {
        catCount.set(ex.category, (catCount.get(ex.category) || 0) + 1);
        totalCount++;
      }
    }

    const lastSeen = new Map<string, string>();
    for (const log of allLogs) {
      if (!log.date) continue;
      for (const ex of log.exercises || []) {
        const cur = lastSeen.get(ex.category);
        if (!cur || log.date > cur) lastSeen.set(ex.category, log.date);
      }
    }
    const today = todayString();
    for (const [category, lastDate] of lastSeen) {
      const days = daysBetween(lastDate, today);
      if (days > 14 && (!neglected || days > neglected.days)) neglected = { category, days };
    }

    let topPart = '';
    if (totalCount > 0) {
      const top = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1])[0];
      const pct = Math.round((top[1] / totalCount) * 100);
      topPart = `🧩 ${CATEGORY_LABELS[top[0]] || top[0]} chiếm ${pct}% khối lượng kỳ này`;
    }
    const neglectedPart = neglected ? `đã ${neglected.days} ngày chưa tập ${CATEGORY_LABELS[neglected.category] || neglected.category}` : '';

    if (topPart && neglectedPart) insights.push(`${topPart} — ${neglectedPart}`);
    else if (topPart) insights.push(topPart);
    else if (neglectedPart) insights.push(`🧩 ${neglectedPart.charAt(0).toUpperCase()}${neglectedPart.slice(1)}`);
  }

  // 3) Consistency: most active weekday + hour window over the last 60 days.
  {
    const cutoff = daysAgoString(60);
    const recent60 = allLogs.filter((l) => l.date && l.date >= cutoff);

    const dowCount = new Map<number, number>();
    for (const log of recent60) {
      if (!log.date) continue;
      const d = new Date(log.date + 'T00:00:00');
      if (isNaN(d.getTime())) continue;
      const dow = (d.getDay() + 6) % 7; // 0=Mon..6=Sun
      dowCount.set(dow, (dowCount.get(dow) || 0) + 1);
    }

    if (dowCount.size > 0) {
      const topDow = Array.from(dowCount.entries()).sort((a, b) => b[1] - a[1])[0][0];

      const hourCount = new Map<number, number>();
      for (const log of recent60) {
        if (!log.createdAt) continue;
        let h: number;
        try {
          h = log.createdAt.toDate().getHours();
        } catch {
          continue;
        }
        const bucket = Math.floor(h / 2) * 2;
        hourCount.set(bucket, (hourCount.get(bucket) || 0) + 1);
      }

      let hourPart = '';
      if (hourCount.size > 0) {
        const topBucket = Array.from(hourCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
        const h1 = topBucket + 2;
        const suffix = topBucket < 12 ? 'sáng' : topBucket < 18 ? 'chiều' : 'tối';
        hourPart = ` và khung ${topBucket}-${h1}h ${suffix}`;
      }

      insights.push(`📅 Anh hay tập nhất vào ${DOW_LABELS[topDow]}${hourPart}`);
    }
  }

  // 4) PRs achieved within the current period.
  {
    const periodDates = new Set(periodLogs.map((l) => l.date).filter(Boolean));
    const periodPRs = computePRs(allLogs)
      .filter((pr) => periodDates.has(pr.achievedDate))
      .sort((a, b) => b.achievedDate.localeCompare(a.achievedDate))
      .slice(0, 2);
    if (periodPRs.length > 0) {
      const parts = periodPRs.map((pr) => `${pr.name} ${getPRLabel(pr)} (${shortDateVi(pr.achievedDate)})`);
      insights.push(`🏆 PR trong kỳ: ${parts.join(', ')}`);
    }
  }

  // 5) Action suggestion: the enabled goal furthest behind this period,
  // falling back to the neglected muscle group if no goals are set.
  {
    const goals = (profile?.exerciseGoals || []).filter((g) => g.enabled);
    const sessionsPerWeek = Math.max(1, profile?.weeklyGoalSessions || 5);
    // Goal targets are defined per week (dailyTarget × sessionsPerWeek) —
    // scale that quota to the actual period length so "Tháng"/"3 tháng"
    // views don't judge a month of reps against a single week's target.
    const sessionsInPeriod = sessionsPerWeek * (Math.max(1, periodDays) / 7);

    let worst: { goal: ExerciseGoal; current: number; target: number; pct: number } | null = null;
    for (const g of goals) {
      const current = sumGoalValue(g, periodLogs);
      const dailyTarget = g.targetReps ?? g.targetDurationSeconds ?? 0;
      const target = Math.round(dailyTarget * sessionsInPeriod);
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      if (!worst || pct < worst.pct) worst = { goal: g, current, target, pct };
    }

    if (worst && worst.pct < 100) {
      const done = formatGoalCount(worst.goal, worst.current);
      const target = formatGoalCount(worst.goal, worst.target);
      const missingRaw = Math.max(0, worst.target - worst.current);
      const missing = formatGoalCount(worst.goal, missingRaw);
      insights.push(
        `🎯 Ưu tiên: ${worst.goal.name} mới đạt ${done.n}/${target.n} ${target.unit} (${worst.pct}%) — còn thiếu ${missing.n} ${missing.unit}`
      );
    } else if (neglected) {
      insights.push(`🎯 Ưu tiên: nên tập lại ${CATEGORY_LABELS[neglected.category] || neglected.category} — đã ${neglected.days} ngày chưa tập`);
    }
  }

  return insights.slice(0, 5);
}
