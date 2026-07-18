import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { estimateLogMinutes } from './weeklyPlan';
import { todayString, daysAgoString, daysBetween } from './date';
import { computePRs } from '../services/prService';
import { CATEGORY_LABELS } from '../constants/exercises';

// Calisthenics reference norms (adult, bodyweight) — thresholds to REACH
// each tier [Cơ bản, Trung cấp, Giỏi, Chuyên nghiệp]. Below the first
// threshold the lifter is still "Mới tập" (tier 0). Only presets with a
// well-known bodyweight-standard exist here; everything else is simply
// excluded from the strength side of the score (never guessed).
const STRENGTH_STANDARDS: Record<string, { unit: 'reps' | 'seconds'; tiers: number[] }> = {
  pushup: { unit: 'reps', tiers: [10, 25, 45, 60] },
  pullup: { unit: 'reps', tiers: [3, 8, 15, 22] },
  squat: { unit: 'reps', tiers: [20, 40, 60, 90] },
  dip: { unit: 'reps', tiers: [5, 12, 25, 40] },
  burpee: { unit: 'reps', tiers: [10, 20, 35, 50] },
  lunge: { unit: 'reps', tiers: [15, 30, 50, 70] },
  situp: { unit: 'reps', tiers: [20, 35, 50, 70] },
  crunch: { unit: 'reps', tiers: [20, 40, 60, 80] },
  plank: { unit: 'seconds', tiers: [30, 60, 120, 180] },
  side_plank: { unit: 'seconds', tiers: [20, 45, 90, 120] },
};

const TIER_NAMES = ['Mới tập', 'Cơ bản', 'Trung cấp', 'Giỏi', 'Chuyên nghiệp']; // index 0..4

// Count of thresholds `best` meets or exceeds -> tier index 0..4.
function tierOf(best: number, tiers: number[]): number {
  let tier = 0;
  for (const t of tiers) {
    if (best >= t) tier++;
  }
  return tier;
}

function fmtBest(best: number, unit: 'reps' | 'seconds'): string {
  return unit === 'reps' ? `${best} cái` : `${best}s`;
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

// ISO week key (Thursday-based week number, same algorithm as getISOWeek in
// lib/date.ts) — a string so it can be hashed directly to rotate the coach
// tip once per week instead of once per day.
function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${thursday.getFullYear()}-W${week}`;
}

type FocusDimension = 'strength' | 'consistency' | 'volume' | 'progression' | 'balance';

// 2-3 short, executive/office-worker-tone tips per dimension. Rotated weekly
// (see isoWeekKey above) and picked from the pool matching whichever
// dimension is currently the user's weakest, so the tip stays relevant.
const TIPS: Record<FocusDimension, string[]> = {
  strength: [
    '💡 Tăng tải từ từ (~10% mỗi tuần) thay vì cố max reps mỗi buổi — bền hơn nhiều.',
    '💡 Chững reps? Thử tempo chậm (3 giây hạ) để cơ chịu tải lâu hơn, hiệu quả hơn đếm số.',
    '💡 Xen kẽ ngày nặng/nhẹ để cơ hồi phục — đừng dồn hết vào 1 buổi rồi nghỉ cả tuần.',
  ],
  consistency: [
    '💡 Đặt lịch tập như một cuộc họp không thể huỷ — 15-20 phút mỗi buổi là đủ.',
    '💡 Dân văn phòng: 3 buổi ngắn đều đặn/tuần hiệu quả hơn 1 buổi dài rồi nghỉ dài.',
    '💡 Nhắc bản thân bằng lịch điện thoại — thói quen thắng ý chí về lâu dài.',
  ],
  volume: [
    '💡 Đi bộ hoặc đạp xe 10 phút giữa giờ làm cũng tính — không cần phòng gym mới đạt chuẩn WHO.',
    '💡 Chia nhỏ 150 phút/tuần thành các đoạn 10-15 phút dễ duy trì hơn 1 buổi dài cuối tuần.',
    '💡 Đứng dậy vận động mỗi giờ làm việc — cộng dồn cả tuần cũng ra số phút đáng kể.',
  ],
  progression: [
    '💡 Ghi lại số liệu mỗi buổi để thấy rõ khi nào đã sẵn sàng tăng tải.',
    '💡 Lâu chưa phá kỷ lục? Thử tăng 1-2 reps mỗi buổi thay vì chờ "ngày sung sức".',
    '💡 Đổi bài tập trong cùng nhóm cơ để phá plateau — cơ thể thích nghi rất nhanh.',
  ],
  balance: [
    '💡 Đừng chỉ tập nhóm cơ quen tay — cân bằng giúp tránh chấn thương lâu dài.',
    '💡 Ngồi nhiều? Ưu tiên nhóm cơ đối kháng (lưng, mông) để giữ tư thế đúng.',
    '💡 Xoay vòng nhóm cơ theo tuần để cơ thể được nghỉ và phát triển đều.',
  ],
};

export interface CoachReport {
  level: string;
  emoji: string;
  score: number;
  rankBasis: string;
  benchmarks: string[];
  weekLine: string;
  focus: string;
  focusTip: string;
}

interface TierEntry {
  presetId: string;
  name: string;
  best: number;
  unit: 'reps' | 'seconds';
  tier: number;
  tiers: number[];
}

// Builds ONE consolidated "HLV cá nhân" report: a 0-100 fitness score scored
// against named benchmarks (WHO activity minutes + calisthenics standards),
// 1-2 concrete "how far to the next tier" comparisons, the period trend line,
// and a single most-urgent focus + a weekly-rotating tip. Returns null with
// no history at all (callers hide the card in that case).
export function buildCoachReport(
  allLogs: WorkoutLog[],
  periodLogs: WorkoutLog[],
  prevPeriodLogs: WorkoutLog[],
  profile: UserProfile | null,
  periodLabel: string,
  periodDays: number,
  prevPeriodDays: number
): CoachReport | null {
  if (allLogs.length === 0) return null;

  // --- Base rates -------------------------------------------------------
  const cutoff56 = daysAgoString(56);
  const sessionsLast56 = allLogs.filter((l) => l.date && l.date >= cutoff56).length;
  const avgSessionsPerWeek = sessionsLast56 / 8;

  const cutoff28 = daysAgoString(28);
  const logs28 = allLogs.filter((l) => l.date && l.date >= cutoff28);
  const avgMinutesPerWeek = logs28.reduce((s, l) => s + estimateLogMinutes(l), 0) / 4;

  const strengthDates = new Set<string>();
  for (const log of logs28) {
    if (!log.date) continue;
    const hasStrength = (log.exercises || []).some((ex) => ex.category === 'strength' || STRENGTH_STANDARDS[ex.presetId]);
    if (hasStrength) strengthDates.add(log.date);
  }
  const strengthDaysPerWeek = strengthDates.size / 4;

  // --- PRs ----------------------------------------------------------------
  const allPRs = computePRs(allLogs);
  const prsLast8w = allPRs.filter((pr) => pr.achievedDate >= cutoff56).length;

  // --- Strength tiers: only presets the user has a PR for AND that have a
  // named standard. ---------------------------------------------------
  const tierEntries: TierEntry[] = [];
  for (const pr of allPRs) {
    const std = STRENGTH_STANDARDS[pr.presetId];
    if (!std) continue;
    const best = std.unit === 'reps' ? pr.bestReps : pr.bestDurationSeconds;
    if (!best) continue;
    tierEntries.push({ presetId: pr.presetId, name: pr.name, best, unit: std.unit, tier: tierOf(best, std.tiers), tiers: std.tiers });
  }
  const hasStrengthTiers = tierEntries.length > 0;

  // --- Sub-scores (0..100) -------------------------------------------
  const strengthScore = hasStrengthTiers ? (tierEntries.reduce((s, e) => s + e.tier, 0) / tierEntries.length / 4) * 100 : 0;
  const consistencyScore = Math.min(100, (avgSessionsPerWeek / 5) * 100);
  let volumeScore = Math.min(100, (avgMinutesPerWeek / 150) * 100);
  if (strengthDaysPerWeek >= 2) volumeScore = Math.min(100, volumeScore + 10);
  const progressionScore = Math.min(100, (prsLast8w / 4) * 100);

  const score = hasStrengthTiers
    ? Math.round(0.4 * strengthScore + 0.3 * consistencyScore + 0.15 * volumeScore + 0.15 * progressionScore)
    : Math.round(0.55 * consistencyScore + 0.25 * volumeScore + 0.2 * progressionScore);

  // --- Level band -------------------------------------------------------
  let level: string;
  let emoji: string;
  if (score < 20) {
    level = 'Mới bắt đầu';
    emoji = '🌱';
  } else if (score < 40) {
    level = 'Cơ bản';
    emoji = '💪';
  } else if (score < 60) {
    level = 'Trung cấp';
    emoji = '🔥';
  } else if (score < 80) {
    level = 'Giỏi';
    emoji = '🏅';
  } else {
    level = 'Chuyên nghiệp';
    emoji = '🏆';
  }

  // --- rankBasis: strongest true, objective statement -------------------
  const topTier = hasStrengthTiers ? tierEntries.reduce((a, b) => (b.tier > a.tier ? b : a)).tier : 0;
  let rankBasis: string;
  if (avgMinutesPerWeek >= 150) {
    rankBasis = `Trên chuẩn WHO (${Math.round(avgMinutesPerWeek)}/150 phút vận động/tuần)`;
  } else if (topTier >= 2) {
    rankBasis = `Nhóm sức mạnh đạt mốc ${TIER_NAMES[topTier]}`;
  } else {
    rankBasis = `~${avgSessionsPerWeek.toFixed(1)} buổi/tuần · chuỗi ${profile?.streak?.current || 0} ngày`;
  }

  // --- benchmarks: 1-2 most-frequently-logged strength exercises that have
  // a named standard, each stated as "so mốc" (at-tier + gap to next). ----
  const freq = new Map<string, number>();
  for (const log of allLogs) {
    const presetsInLog = new Set((log.exercises || []).map((ex) => ex.presetId));
    for (const pid of presetsInLog) {
      if (STRENGTH_STANDARDS[pid]) freq.set(pid, (freq.get(pid) || 0) + 1);
    }
  }
  const topFrequentIds = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([pid]) => pid);
  const benchmarks: string[] = topFrequentIds
    .map((pid) => tierEntries.find((e) => e.presetId === pid))
    .filter((e): e is TierEntry => !!e)
    .map((e) => {
      const bestFmt = fmtBest(e.best, e.unit);
      if (e.tier === 0) {
        return `${e.name}: ${bestFmt} → chưa đạt mốc Cơ bản (${e.tiers[0]}), còn ${e.tiers[0] - e.best}.`;
      }
      if (e.tier === 4) {
        return `${e.name}: ${bestFmt} → Chuyên nghiệp (mốc ${e.tiers[3]}) ✓ đỉnh bảng.`;
      }
      return `${e.name}: ${bestFmt} → ${TIER_NAMES[e.tier]} (mốc ${e.tiers[e.tier - 1]}); cách ${TIER_NAMES[e.tier + 1]} (${e.tiers[e.tier]}) còn ${e.tiers[e.tier] - e.best}.`;
    });

  // --- weekLine: period trend vs previous period, prorated to the same
  // elapsed-day count (unchanged logic from the old buildCoachInsights). ---
  let weekLine: string;
  {
    const prorateRatio = prevPeriodDays > 0 ? periodDays / prevPeriodDays : 1;
    const sessions = periodLogs.length;
    const minutes = periodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0);
    const prevSessions = Math.round(prevPeriodLogs.length * prorateRatio);
    const prevMinutes = Math.round(prevPeriodLogs.reduce((s, l) => s + estimateLogMinutes(l), 0) * prorateRatio);

    if (prevSessions === 0 && prevMinutes === 0) {
      weekLine = `📈 ${periodLabel}: ${sessions} buổi · ${minutes} phút — kỳ trước chưa tập`;
    } else {
      const sessDelta = sessions - prevSessions;
      const minDelta = minutes - prevMinutes;
      const trendUp = minDelta > 0 || (minDelta === 0 && sessDelta >= 0);
      const trendEmoji = trendUp ? '📈' : '📉';
      const verb = trendUp ? 'hơn' : 'kém';
      const sessPart = sessDelta === 0 ? 'bằng kỳ trước về số buổi' : `${verb} kỳ trước ${Math.abs(sessDelta)} buổi`;
      const minPart = `${minDelta >= 0 ? '+' : ''}${minDelta} phút`;
      weekLine = `${trendEmoji} ${periodLabel}: ${sessions} buổi · ${minutes} phút — ${sessPart}, ${minPart}`;
    }
  }

  // --- Neglected muscle group over full history (used as a focus
  // tie-break override when balance is clearly off). ---------------------
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

  // --- focus: directive tied to the weakest sub-score, falling through to
  // the next-weakest if the top pick can't produce concrete text (e.g. all
  // tracked lifts already maxed out). ------------------------------------
  function focusForStrength(): string | null {
    const nonMaxed = tierEntries.filter((e) => e.tier < 4);
    if (nonMaxed.length === 0) return null;
    const lowest = nonMaxed.reduce((a, b) => (b.tier < a.tier ? b : a));
    const nextThreshold = lowest.tiers[lowest.tier];
    return `Đẩy ${lowest.name} từ ${fmtBest(lowest.best, lowest.unit)} lên ${fmtBest(nextThreshold, lowest.unit)} để đạt mốc ${TIER_NAMES[lowest.tier + 1]}.`;
  }
  function focusForConsistency(): string {
    const target = Math.min(6, Math.ceil(avgSessionsPerWeek) + 1);
    return `Nâng tần suất lên ${target} buổi/tuần (hiện ~${avgSessionsPerWeek.toFixed(1)}).`;
  }
  function focusForVolume(): string {
    const add = Math.max(10, Math.round(150 - avgMinutesPerWeek));
    return `Thêm ~${add} phút vận động/tuần để chạm chuẩn WHO 150.`;
  }
  function focusForProgression(): string {
    if (allPRs.length === 0) return 'Chưa có PR nào — chọn 1 bài để phá mốc.';
    const mostRecent = allPRs.reduce((a, b) => (b.achievedDate > a.achievedDate ? b : a));
    const weeksSince = Math.floor(daysBetween(mostRecent.achievedDate, todayString()) / 7);
    return `${weeksSince} tuần chưa có PR — tăng nhẹ tải để phá mốc.`;
  }

  const subScores: { key: FocusDimension; score: number }[] = [];
  if (hasStrengthTiers) subScores.push({ key: 'strength', score: strengthScore });
  subScores.push({ key: 'consistency', score: consistencyScore });
  subScores.push({ key: 'volume', score: volumeScore });
  subScores.push({ key: 'progression', score: progressionScore });
  subScores.sort((a, b) => a.score - b.score);

  let focusCore: string | null = null;
  let usedDimension: FocusDimension = 'consistency';
  for (const s of subScores) {
    const text =
      s.key === 'strength' ? focusForStrength() : s.key === 'consistency' ? focusForConsistency() : s.key === 'volume' ? focusForVolume() : focusForProgression();
    if (text) {
      focusCore = text;
      usedDimension = s.key;
      break;
    }
  }
  if (!focusCore) {
    focusCore = focusForConsistency();
    usedDimension = 'consistency';
  }

  const balanceOverride = !!neglected && neglected.days >= 21;
  const focus = balanceOverride
    ? `🎯 Đã ${neglected!.days} ngày chưa tập ${CATEGORY_LABELS[neglected!.category] || neglected!.category} — cân lại nhóm cơ.`
    : `🎯 ${focusCore}`;
  const tipDimension: FocusDimension = balanceOverride ? 'balance' : usedDimension;

  // --- focusTip: rotates weekly, not daily — same hashSeed pattern used
  // for other "pick 1 of N" spots in this app, keyed by ISO week so it
  // stays constant within a week and changes the next. -------------------
  const weekKey = isoWeekKey(todayString());
  const pool = TIPS[tipDimension];
  const focusTip = pool[hashSeed(weekKey) % pool.length];

  return { level, emoji, score, rankBasis, benchmarks, weekLine, focus, focusTip };
}
