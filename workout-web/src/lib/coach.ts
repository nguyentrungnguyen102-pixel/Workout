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

  // Ratio to scale the previous period's totals down to the current period's
  // elapsed-day count. Callers pass prevPeriodDays === periodDays when both
  // periods being compared are already-closed (full) periods — day-count
  // differences there are calendar noise (31-day Jan vs 28-day Feb), not a
  // real signal, so the ratio is a no-op (1) in that case.
  const prorateRatio = prevPeriodDays > 0 ? periodDays / prevPeriodDays : 1;

  // 1) Period trend: sessions + minutes vs previous period (prorated to the
  // same elapsed-day count so a period still in progress isn't compared
  // against a previous period's full total).
  {
    const sessions = periodLogs.length;
    const minutes = periodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0);
    const prevSessions = Math.round(prevPeriodLogs.length * prorateRatio);
    const prevMinutes = Math.round(prevPeriodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0) * prorateRatio);

    if (prevSessions === 0 && prevMinutes === 0) {
      insights.push(`📈 ${periodLabel}: ${sessions} buổi · ${minutes} phút — kỳ trước chưa tập`);
    } else {
      const sessDelta = sessions - prevSessions;
      const minDelta = minutes - prevMinutes;
      const trendUp = minDelta > 0 || (minDelta === 0 && sessDelta >= 0);
      const emoji = trendUp ? '📈' : '📉';
      const verb = trendUp ? 'hơn' : 'kém';
      const sessPart = sessDelta === 0 ? 'bằng kỳ trước về số buổi' : `${verb} kỳ trước ${Math.abs(sessDelta)} buổi`;
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

    let worst: { goal: ExerciseGoal; current: number; target: number; pct: number } | null = null;
    for (const g of goals) {
      const current = sumGoalValue(g, periodLogs);
      const dailyTarget = g.targetReps ?? g.targetDurationSeconds ?? 0;
      // Weekly quota (dailyTarget × sessionsPerWeek) scaled to this period's
      // actual day count — a week's quota shouldn't stand in unscaled for a
      // month or quarter, which clamped % done at 100% far too early.
      // Rounded so formatGoalCount (which doesn't round reps) prints a whole
      // number instead of a fractional target.
      const target = Math.round(dailyTarget * sessionsPerWeek * (periodDays / 7));
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

// Deterministic small hash — same pattern as lib/cheers.ts hashSeed, kept
// local here so this file doesn't need to import from cheers.ts.
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

const OFFICE_TIPS: string[] = [
  '💡 Dân văn phòng: thêm 2 phút giãn vai–gáy cuối buổi để đỡ mỏi cổ.',
  '💡 Ngồi nhiều? Xen kẽ squat/plank giữa giờ làm để kích hoạt cơ core.',
  '💡 Uống đủ nước và ngủ 7h — cơ bắp phục hồi khi nghỉ, không phải lúc tập.',
  '💡 Khởi động 3–5 phút trước khi tập nặng để tránh chấn thương.',
  '💡 Người Việt hay bỏ chân — đừng skip squat/lunge, nền tảng sức mạnh toàn thân.',
  '💡 Tăng tải từ từ (~10% mỗi tuần) để tiến bộ bền, tránh quá sức.',
];

export interface CoachAssessment {
  level: string;
  emoji: string;
  reason: string;
  verdict: string;
  improve: string;
  tip: string;
}

// Rule-based "level check" — a coach's read on where the user stands
// (nghiệp dư → chuyên nghiệp) plus a structural verdict on their training
// routine (frequency / variety / progress), distinct from buildCoachInsights'
// period-over-period numeric callouts above. Returns null with no history at
// all, same convention as buildCoachInsights returning [].
export function buildCoachAssessment(allLogs: WorkoutLog[], profile: UserProfile | null): CoachAssessment | null {
  if (allLogs.length === 0) return null;

  const totalSessions = allLogs.length;

  // Distinct active ISO-weeks (year+week key) the user actually trained in.
  const weekKeys = new Set<string>();
  for (const log of allLogs) {
    if (!log.date) continue;
    const d = new Date(log.date + 'T00:00:00');
    if (isNaN(d.getTime())) continue;
    const thursday = new Date(d);
    thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    weekKeys.add(`${thursday.getFullYear()}-W${week}`);
  }
  const activeWeeks = weekKeys.size;

  // Avg sessions/week over the last 8 weeks (56 days).
  const last56Cutoff = daysAgoString(56);
  const sessionsLast56 = allLogs.filter((l) => l.date && l.date >= last56Cutoff).length;
  const avgPerWeek = sessionsLast56 / 8;

  // Distinct categories ever trained.
  const categorySet = new Set<string>();
  for (const log of allLogs) {
    for (const ex of log.exercises || []) {
      if (ex?.category) categorySet.add(ex.category);
    }
  }
  const categories = categorySet.size;

  const prCount = computePRs(allLogs).length;

  // Longest-neglected category — same lastSeen/daysBetween approach as
  // buildCoachInsights' step 2 above, but over the FULL history rather than
  // just the current period, since this is an overall structural check.
  let neglected: { category: string; days: number } | null = null;
  {
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
  }

  // Level (first match wins).
  let level: string;
  let emoji: string;
  let reason: string;
  if (totalSessions < 8 || activeWeeks < 2) {
    level = 'Người mới bắt đầu';
    emoji = '🌱';
    reason = `Mới ${totalSessions} buổi — cứ đều đặn là tiến bộ.`;
  } else if (avgPerWeek < 2.5 || categories <= 2) {
    level = 'Nghiệp dư';
    emoji = '💪';
    reason = `Khoảng ~${avgPerWeek.toFixed(1)} buổi/tuần, mới tập ${categories} nhóm cơ — tập thêm đều & đa dạng hơn nhé.`;
  } else if (avgPerWeek >= 5 && categories >= 4 && prCount > 0) {
    level = 'Chuyên nghiệp';
    emoji = '🏆';
    reason = `~${avgPerWeek.toFixed(1)} buổi/tuần, ${categories} nhóm cơ, đã có ${prCount} kỷ lục cá nhân — rất kỷ luật.`;
  } else {
    level = 'Trung cấp';
    emoji = '🔥';
    reason = `~${avgPerWeek.toFixed(1)} buổi/tuần, ${categories} nhóm cơ đã tập — nền tảng khá ổn.`;
  }

  // Verdict — judges STRUCTURE (frequency/variety/progress), not form.
  const balanced = !neglected && avgPerWeek >= 3 && prCount > 0;
  let verdict: string;
  let improve: string;
  if (balanced) {
    verdict = 'Cách tập khá cân đối ✅ — tần suất tốt, nhóm cơ đa dạng, có tiến bộ.';
    improve = '📌 Cần cải thiện: giữ vững nhịp độ hiện tại và tăng dần độ khó.';
  } else if (neglected) {
    verdict = `Cách tập chưa chuẩn ở điểm bỏ quên ${CATEGORY_LABELS[neglected.category] || neglected.category} (${neglected.days} ngày chưa tập).`;
    improve = `📌 Cần cải thiện: tập lại ${CATEGORY_LABELS[neglected.category] || neglected.category} để cân bằng nhóm cơ.`;
  } else if (avgPerWeek < 3) {
    verdict = `Cách tập chưa chuẩn ở tần suất — chỉ ~${avgPerWeek.toFixed(1)} buổi/tuần (dưới 3 buổi/tuần).`;
    improve = '📌 Cần cải thiện: nâng tần suất lên 3–4 buổi/tuần.';
  } else {
    verdict = 'Cách tập chưa chuẩn ở điểm thiếu tiến bộ — lâu rồi chưa phá kỷ lục nào.';
    improve = '📌 Cần cải thiện: tăng dần reps/thời gian để phá kỷ lục.';
  }

  const tip = OFFICE_TIPS[hashSeed(todayString()) % OFFICE_TIPS.length];

  return { level, emoji, reason, verdict, improve, tip };
}
