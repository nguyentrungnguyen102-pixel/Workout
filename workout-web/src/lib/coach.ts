import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { daysAgoString, daysBetween, todayString } from './date';
import { computePRs, PersonalRecord } from '../services/prService';
import { logMinutes, ENERGY_METHOD_NOTE } from './energy';
import { strengthStandard, bmiStandard, whoActivityStandard, ageFromBirthYear, Band } from './standards';

// Dynamic, standards-backed "Đánh giá thể lực" (fitness assessment) engine.
// Replaces the old buildCoachReport (hardcoded STRENGTH_STANDARDS/TIER_NAMES
// tier arrays + canned TIPS pool) with dimensions scored against the
// published-standard evaluators in standards.ts (ExRx/ACSM strength norms,
// WHO 2020 activity guideline, Asian/VN BMI cutoffs) plus two training
// heuristics (consistency, progression) that are explicitly labeled as
// in-app recommendations rather than external citations.
//
// v2.21.0: the 5 dimensions feed a single "Nhập môn/Nghiệp dư/Bán chuyên/
// Chuyên nghiệp" composite tier (an in-app synthesis, not itself an external
// standard) with a week-over-week delta, so a user can see the ONE number
// move instead of only 5 separate bars. See buildActivityDim/
// buildConsistencyDim/buildProgressionDim + composite() below.

type ScoredDimensionKey = 'strength' | 'activity' | 'consistency' | 'body' | 'progression';

export interface AssessmentDimension {
  key: ScoredDimensionKey | 'overall';
  label: string;
  valueText: string;
  tierLabel: string;
  bands: { label: string; min: number }[];
  value: number;
  unit: string;
  source: string;
  nextText?: string;
  score: number;
}

export interface FitnessAssessment {
  score: number;
  level: string;
  emoji: string;
  prevScore: number | null;
  prevLevel: string | null;
  overall: AssessmentDimension;
  weights: { key: string; label: string; pct: number }[];
  dimensions: AssessmentDimension[];
  weekLine: string;
  focus: string;
  needsProfile: boolean;
  methodNote: string;
  scopeNote: string;
}

// Selected Stats period (Tuần/Tháng/Quý). When provided, the window-based
// dimensions (activity, consistency, progression) and the trend line are
// computed over THIS period instead of fixed rolling windows, so the panel
// responds to the period filter. Strength (accumulated capability vs the
// published norm) and Body/BMI (current status) are point-in-time by nature
// and stay the same across periods — including between the current-period
// and previous-period composite (see prevScore), so a lagging/improving
// strength or BMI never accidentally drives the week-over-week delta.
//
// prevStart/prevEnd: the previous period's own date range (for progression's
// PR-date filtering on that side) — kept separate from prevLogs/prevDays
// because callers may TRUNCATE prevLogs to the same elapsed-day count as the
// current (possibly in-progress) period for an honest delta (see StatsPage's
// coachPrevPeriodLogs), while prevStart/prevEnd should stay the full range
// for goal-relevant date filtering. Both prevLogs and [prevStart,prevEnd]
// should describe the SAME window from the caller's perspective.
export interface AssessmentPeriod {
  logs: WorkoutLog[];
  prevLogs: WorkoutLog[];
  label: string;
  days: number;
  prevDays: number;
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
}

const BASE_WEIGHTS: Record<ScoredDimensionKey, number> = {
  strength: 35,
  activity: 20,
  consistency: 20,
  body: 15,
  progression: 10,
};

const DIMENSION_LABELS: Record<ScoredDimensionKey, string> = {
  strength: 'Sức mạnh',
  activity: 'Vận động (WHO)',
  consistency: 'Đều đặn',
  body: 'Vóc dáng',
  progression: 'Tiến bộ',
};

// Composite tier vocabulary — "Nhập môn → Nghiệp dư → Bán chuyên →
// Chuyên nghiệp" per anh's own suggested naming (gym-culture terms, not
// clinical grading language). Cutoffs (40/60/80) are the OLD 5-tier scheme
// (20/40/60/80) with the bottom two bands merged (<20 + <40 → <40) — every
// other boundary kept exactly, so the new scale has a defensible lineage
// rather than invented numbers. Simulating the composite formula across the
// realistic parameter space (5 strength tiers × 3 activity tiers × 1-6
// sessions/wk × BMI normal/off × 0-3 PRs/month) puts the median around ~57:
// cutting at 40/60/80 keeps "Chuyên nghiệp" genuinely rare and "Nhập môn"
// reachable by an actual beginner, unlike a naive equal-width 4-way split.
const OVERALL_BANDS: Band[] = [
  { label: 'Nhập môn', min: 0 },
  { label: 'Nghiệp dư', min: 40 },
  { label: 'Bán chuyên', min: 60 },
  { label: 'Chuyên nghiệp', min: 80 },
];
const OVERALL_EMOJI = ['🌱', '💪', '🔥', '🏆'];

// Exported so both buildFitnessAssessment (current + previous period) and
// coach.test.ts's tier-boundary test share the exact same lookup instead of
// duplicating the OVERALL_BANDS/OVERALL_EMOJI pairing inline.
export function levelForScore(score: number): { level: string; emoji: string } {
  const tierIndex = tierFor(score, OVERALL_BANDS);
  return { level: OVERALL_BANDS[tierIndex].label, emoji: OVERALL_EMOJI[tierIndex] };
}

interface DimBuild {
  dimension: AssessmentDimension;
  hasData: boolean;
  focusText: string;
}

// Generic ascending-band tier lookup for the two in-app heuristic
// dimensions (consistency/progression) that aren't backed by a
// standards.ts published table — higher value is always better for both.
// Also used for the overall composite's own 4-band lookup.
function tierFor(value: number, bands: Band[]): number {
  let tier = 0;
  bands.forEach((b, i) => {
    if (value >= b.min) tier = i;
  });
  return tier;
}

function nextMilestoneText(value: number, bands: Band[], unit: string, tierIndex: number): string | undefined {
  if (tierIndex >= bands.length - 1) return undefined;
  const need = Math.round((bands[tierIndex + 1].min - value) * 10) / 10;
  if (need <= 0) return undefined;
  return `cần +${need}${unit ? ' ' + unit : ''} để đạt ${bands[tierIndex + 1].label}`;
}

// Linear interpolation WITHIN the value's current band, converging to
// exactly 100 once the value reaches the top band's threshold (matching the
// old tierIndex/(bands.length-1)*100 convention at every band boundary, but
// no longer frozen in between them). Two of the five dimensions (strength,
// activity) previously only moved in ~11-25 point composite jumps — going
// from 28 to 29 push-ups, or 140 to 149 minutes/week, changed nothing until
// a tier was actually crossed. This is what makes the composite score (and
// therefore the week-over-week delta) visibly move on an ordinary week,
// which a tier-vocabulary rename alone would not fix.
//
// NOT the same helper as standards.ts's scaleMarkerPercent — that one
// divides by bands.length (not length-1) and parks the marker at the
// midpoint of the open-ended top band, which is correct for a visual
// "where does the dot sit in this bar" position but would cap a maxed-out
// dimension's score at 90, not 100.
function bandProgressPercent(value: number, bands: Band[]): number {
  const n = bands.length;
  if (n <= 1) return 100;
  const tierIndex = tierFor(value, bands);
  if (tierIndex >= n - 1) return 100;
  const segment = 100 / (n - 1);
  const lo = bands[tierIndex].min;
  const hi = bands[tierIndex + 1].min;
  const frac = hi > lo ? Math.min(1, Math.max(0, (value - lo) / (hi - lo))) : 1;
  return Math.min(100, (tierIndex + frac) * segment);
}

// Weighted average of the scored dimensions' own .score (0-100), skipping
// any with hasData=false and renormalizing the remaining weights — e.g. a
// profile missing sex/birthYear drops "strength" (35%) and redistributes
// its weight across the other 4. Pure/stateless so it can be called twice
// (current period, previous period) against different dimension builds.
function composite(builds: DimBuild[]): { score: number; weights: { key: string; label: string; pct: number }[] } {
  const totalWeight = builds.reduce((s, d) => s + (d.hasData ? BASE_WEIGHTS[d.dimension.key as ScoredDimensionKey] : 0), 0);
  const score =
    totalWeight > 0
      ? Math.round(
          builds.reduce((s, d) => s + (d.hasData ? d.dimension.score * BASE_WEIGHTS[d.dimension.key as ScoredDimensionKey] : 0), 0) /
            totalWeight
        )
      : 0;
  const weights = builds
    .filter((d) => d.hasData)
    .map((d) => ({
      key: d.dimension.key,
      label: d.dimension.label,
      pct: Math.round((BASE_WEIGHTS[d.dimension.key as ScoredDimensionKey] / totalWeight) * 100),
    }));
  return { score, weights };
}

// Best reps/duration achieved per presetId within a recent window — reflects
// CURRENT form rather than an all-time PR that may be stale. computePRs() in
// prService.ts deliberately never decays (correct for "Kỷ lục cá nhân 🏆"/
// Thành tựu, which are lifetime bragging rights), but strength SCORING needs
// the opposite: how strong is anh right now, not what he once hit years ago.
// 90 days is wide enough that an exercise trained only every couple of weeks
// still has a recent data point, narrow enough to track actual current
// capability. Mirrors the same unit convention as prService.ts's computePRs
// (reps vs seconds) but as a single-pass max — no need to track improvement
// history, only "best in window".
const STRENGTH_WINDOW_DAYS = 90;

interface RecentBest {
  presetId: string;
  name: string;
  unit: string;
  best: number;
}

function computeRecentBests(logs: WorkoutLog[], cutoff: string): Map<string, RecentBest> {
  const map = new Map<string, RecentBest>();
  for (const log of logs) {
    if (!log.date || log.date < cutoff) continue;
    for (const ex of log.exercises || []) {
      const value = ex.unit === 'reps' ? ex.reps : ex.unit === 'seconds' ? ex.durationSeconds : undefined;
      if (!value) continue;
      const existing = map.get(ex.presetId);
      if (!existing || value > existing.best) {
        map.set(ex.presetId, { presetId: ex.presetId, name: ex.name, unit: ex.unit, best: value });
      }
    }
  }
  return map;
}

// --- activity (WHO) — over an arbitrary window, normalized per week --------
function buildActivityDim(logs: WorkoutLog[], weeks: number): DimBuild {
  const weeklyMinutes = logs.reduce((s, l) => s + logMinutes(l), 0) / weeks;

  const strengthDates = new Set<string>();
  for (const log of logs) {
    if (!log.date) continue;
    const hasStrength = (log.exercises || []).some((ex) => ex.category === 'strength' || ex.category === 'dumbbell');
    if (hasStrength) strengthDates.add(log.date);
  }
  const strengthDaysPerWeek = strengthDates.size / weeks;

  const std = whoActivityStandard(weeklyMinutes, strengthDaysPerWeek);
  const score = bandProgressPercent(std.value, std.bands);
  const nextText = std.nextMilestone
    ? `cần +${std.nextMilestone.need} ${std.unit} để đạt ${std.nextMilestone.toLabel}`
    : undefined;

  return {
    hasData: true,
    dimension: {
      key: 'activity',
      label: DIMENSION_LABELS.activity,
      valueText: `${Math.round(weeklyMinutes)} phút/tuần`,
      tierLabel: std.bands[std.tierIndex].label,
      bands: std.bands,
      value: std.value,
      unit: std.unit,
      source: std.source,
      nextText,
      score,
    },
    focusText: std.nextMilestone
      ? `Thêm ${std.nextMilestone.need} phút vận động/tuần để đạt mốc ${std.nextMilestone.toLabel} của WHO.`
      : `Đã đạt mức vận động tối ưu theo WHO (${Math.round(weeklyMinutes)} phút/tuần) — duy trì nhịp này.`,
  };
}

// --- consistency (in-app heuristic, not an external standard) --------------
function buildConsistencyDim(logs: WorkoutLog[], weeks: number): DimBuild {
  const avgSessionsPerWeek = logs.length / weeks;
  const bands: Band[] = [
    { label: 'Thấp', min: 0 },
    { label: 'Ổn', min: 3 },
    { label: 'Tốt', min: 4 },
    { label: 'Xuất sắc', min: 5 },
  ];
  const tierIndex = tierFor(avgSessionsPerWeek, bands);
  const score = Math.min(100, (avgSessionsPerWeek / 5) * 100);
  const nextText = nextMilestoneText(avgSessionsPerWeek, bands, 'buổi/tuần', tierIndex);

  return {
    hasData: true,
    dimension: {
      key: 'consistency',
      label: DIMENSION_LABELS.consistency,
      valueText: `${avgSessionsPerWeek.toFixed(1)} buổi/tuần`,
      tierLabel: bands[tierIndex].label,
      bands,
      value: Math.round(avgSessionsPerWeek * 10) / 10,
      unit: 'buổi/tuần',
      source: 'Khuyến nghị tập luyện (3–5 buổi/tuần)',
      nextText,
      score,
    },
    focusText: nextText
      ? `Nâng tần suất lên ${bands[tierIndex + 1].min} buổi/tuần (hiện ~${avgSessionsPerWeek.toFixed(1)}).`
      : `Đang duy trì ${avgSessionsPerWeek.toFixed(1)} buổi/tuần — giữ nhịp này.`,
  };
}

// --- progression (in-app heuristic: PRs achieved within [startDate,endDate]) --
function buildProgressionDim(
  allPRs: PersonalRecord[],
  startDate: string,
  endDate: string,
  weeks: number,
  bandUnitLabel: string
): DimBuild {
  const prCount = allPRs.filter((pr) => pr.achievedDate >= startDate && pr.achievedDate <= endDate).length;
  // Bands scale with the period length: ~1 PR = making progress, ~1 PR/2wk =
  // breaking through. Keeps thresholds fair for a week vs a quarter.
  const bands: Band[] = [
    { label: 'Chững', min: 0 },
    { label: 'Tiến bộ', min: 1 },
    { label: 'Bứt phá', min: Math.max(2, Math.round(weeks / 2)) },
  ];
  const tierIndex = tierFor(prCount, bands);
  // 1 PR per 2 weeks → 100.
  const score = Math.min(100, (prCount / Math.max(1, weeks / 2)) * 100);
  const nextText = nextMilestoneText(prCount, bands, 'PR', tierIndex);

  let focusText: string;
  if (nextText) {
    focusText = `Cần thêm ${bands[tierIndex + 1].min - prCount} PR để đạt mốc ${bands[tierIndex + 1].label}.`;
  } else if (allPRs.length === 0) {
    focusText = 'Chưa có PR nào — chọn 1 bài để phá mốc.';
  } else {
    const mostRecent = allPRs.reduce((a, b) => (b.achievedDate > a.achievedDate ? b : a));
    const weeksSince = Math.floor(daysBetween(mostRecent.achievedDate, todayString()) / 7);
    focusText = `${weeksSince} tuần chưa có PR mới — tăng nhẹ tải để phá mốc.`;
  }

  return {
    hasData: true,
    dimension: {
      key: 'progression',
      label: DIMENSION_LABELS.progression,
      valueText: `${prCount} ${bandUnitLabel}`,
      tierLabel: bands[tierIndex].label,
      bands,
      value: prCount,
      unit: 'PR',
      source: 'Nhịp tiến bộ (progressive overload)',
      nextText,
      score,
    },
    focusText,
  };
}

// Builds ONE consolidated "Đánh giá thể lực" (0-100 composite + per-dimension
// scale/position) from real logged data, scored against published/cited
// standards wherever one exists. Returns null only when there's no history
// at all (callers hide the card in that case).
export function buildFitnessAssessment(
  allLogs: WorkoutLog[],
  profile: UserProfile | null,
  latestWeightKg?: number,
  period?: AssessmentPeriod
): FitnessAssessment | null {
  if (allLogs.length === 0) return null;

  const today = todayString();
  // Weeks covered by the selected period (for per-week normalization). Floored
  // at 1/7 so a single-day "to date" window doesn't divide by ~0.
  const periodWeeks = period ? Math.max(1, period.days) / 7 : 4;
  const hasSex = !!profile?.sex;
  const hasBirthYear = !!profile?.birthYear;
  const hasHeight = !!profile?.heightCm;
  const needsProfile = !hasSex || !hasBirthYear || !hasHeight;

  const allPRs = computePRs(allLogs);
  const cutoff56 = daysAgoString(56); // 8 weeks

  // --- strength (current-state, NOT period-scoped — shared as-is between
  // the current-period and previous-period composite calls below) ----------
  const strengthBuild: DimBuild = (() => {
    const label = DIMENSION_LABELS.strength;
    if (!hasSex || !hasBirthYear) {
      return {
        hasData: false,
        dimension: {
          key: 'strength',
          label,
          valueText: 'Thiếu giới tính/năm sinh',
          tierLabel: 'Cần hồ sơ',
          bands: [],
          value: 0,
          unit: '',
          source: 'Nguồn: ExRx/ACSM — cần giới tính + năm sinh để chấm theo đúng bảng chuẩn',
          score: 0,
        },
        focusText: 'Nhập giới tính và năm sinh trong Cài đặt để chấm sức mạnh theo chuẩn.',
      };
    }
    const age = ageFromBirthYear(profile!.birthYear!);
    const sex = profile!.sex!;

    // Frequency of each presetId across all logs, to pick the user's "main"
    // (most-practiced) standardized lift as the headline/scale-bar anchor.
    const freq = new Map<string, number>();
    for (const log of allLogs) {
      const presetsInLog = new Set((log.exercises || []).map((ex) => ex.presetId));
      for (const pid of presetsInLog) freq.set(pid, (freq.get(pid) || 0) + 1);
    }

    // Match against RECENT form (best in the last STRENGTH_WINDOW_DAYS), not
    // the all-time PR — see computeRecentBests's comment above for why.
    const recentCutoff = daysAgoString(STRENGTH_WINDOW_DAYS);
    const recentBests = computeRecentBests(allLogs, recentCutoff);

    const matched: { name: string; std: NonNullable<ReturnType<typeof strengthStandard>>; freq: number }[] = [];
    for (const rb of recentBests.values()) {
      const std = strengthStandard(rb.presetId, rb.best, sex, age);
      if (!std) continue;
      matched.push({ name: rb.name, std, freq: freq.get(rb.presetId) || 0 });
    }

    if (matched.length === 0) {
      // Distinguish "never trained a standard-covered exercise" from "has
      // trained one before, just not within the recent window" — the latter
      // shouldn't read as if anh has literally never done a push-up.
      const everMatched = allPRs.some((pr) => {
        const best = pr.unit === 'seconds' ? pr.bestDurationSeconds : pr.bestReps;
        return !!best && !!strengthStandard(pr.presetId, best, sex, age);
      });
      return {
        hasData: false,
        dimension: {
          key: 'strength',
          label,
          valueText: everMatched
            ? `Không tập hít đất/gập bụng/plank/squat/hít xà trong ${STRENGTH_WINDOW_DAYS} ngày gần đây`
            : 'Chưa có bài có chuẩn (hít đất, gập bụng, plank, squat, hít xà)',
          tierLabel: 'Chưa đủ dữ liệu',
          bands: [],
          value: 0,
          unit: '',
          source: 'Nguồn: ExRx/ACSM push-up/sit-up/plank/squat/pull-up norms',
          score: 0,
        },
        focusText: everMatched
          ? `Tập lại hít đất, gập bụng, plank, squat hoặc hít xà trong ${STRENGTH_WINDOW_DAYS} ngày gần đây để có điểm sức mạnh cập nhật.`
          : 'Tập thêm hít đất, gập bụng, plank, squat hoặc hít xà để có chuẩn chấm sức mạnh.',
      };
    }

    matched.sort((a, b) => b.freq - a.freq || b.std.tierIndex - a.std.tierIndex);
    const primary = matched[0];
    const score = matched.reduce((s, m) => s + bandProgressPercent(m.std.value, m.std.bands), 0) / matched.length;
    const nextText = primary.std.nextMilestone
      ? `cần +${primary.std.nextMilestone.need} ${primary.std.unit} để đạt ${primary.std.nextMilestone.toLabel}`
      : undefined;

    // Score is a weighted average across ALL matched exercises (not just
    // `primary`) — the headline text lists every one with its own tier so
    // what's shown matches what's actually being scored, not just 1 bài.
    const valueText = matched
      .map((m) => `${m.name} ${m.std.value} ${m.std.unit} (${m.std.bands[m.std.tierIndex].label})`)
      .join(' · ');

    return {
      hasData: true,
      dimension: {
        key: 'strength',
        label,
        valueText,
        tierLabel: primary.std.bands[primary.std.tierIndex].label,
        bands: primary.std.bands,
        value: primary.std.value,
        unit: primary.std.unit,
        source: `${primary.std.source} · trung bình có trọng số ${matched.length} bài đã tập trong ${STRENGTH_WINDOW_DAYS} ngày gần đây`,
        nextText,
        score,
      },
      focusText: primary.std.nextMilestone
        ? `Đẩy ${primary.name} thêm ${primary.std.nextMilestone.need} ${primary.std.unit} để đạt mốc ${primary.std.nextMilestone.toLabel}.`
        : `${primary.name} đã đạt mốc cao nhất (${primary.std.bands[primary.std.tierIndex].label}) — thử thêm bài mới để mở rộng thế mạnh.`,
    };
  })();

  // --- body (BMI, Asian/VN cutoffs — current-state, NOT period-scoped) -----
  const bodyBuild: DimBuild = (() => {
    const label = DIMENSION_LABELS.body;
    if (!hasHeight || !latestWeightKg || latestWeightKg <= 0) {
      return {
        hasData: false,
        dimension: {
          key: 'body',
          label,
          valueText: 'Thiếu chiều cao/cân nặng',
          tierLabel: 'Cần hồ sơ',
          bands: [],
          value: 0,
          unit: 'kg/m²',
          source: 'Nguồn: WHO Western Pacific 2000 / Bộ Y tế VN — cần chiều cao + cân nặng để tính BMI',
          score: 0,
        },
        focusText: 'Nhập chiều cao (Cài đặt) và cân nặng (mục Cơ thể) để chấm BMI.',
      };
    }
    const std = bmiStandard(latestWeightKg, profile!.heightCm!);
    const normalIndex = std.bands.findIndex((b) => b.label === 'Bình thường');

    let score: number;
    if (std.tierIndex === normalIndex) score = 100;
    else score = Math.max(0, 100 - Math.abs(std.tierIndex - normalIndex) * 30);

    let nextText: string | undefined;
    let focusText: string;
    if (std.tierIndex < normalIndex) {
      const need = Math.round((std.bands[normalIndex].min - std.value) * 10) / 10;
      nextText = `cần +${need} để đạt Bình thường`;
      focusText = `Tăng cân nhẹ (~${need} đơn vị BMI) để về mức Bình thường.`;
    } else if (std.tierIndex > normalIndex) {
      const upperNormal = std.bands[normalIndex + 1]?.min ?? std.value;
      const need = Math.max(0.1, Math.round((std.value - upperNormal + 0.1) * 10) / 10);
      nextText = `cần giảm ~${need} để về Bình thường`;
      focusText = `Giảm nhẹ cân nặng (~${need} đơn vị BMI) để về mức Bình thường.`;
    } else {
      focusText = `BMI ${std.value} đang ở mức Bình thường — duy trì tốt.`;
    }

    return {
      hasData: true,
      dimension: {
        key: 'body',
        label,
        valueText: `BMI ${std.value}`,
        tierLabel: std.bands[std.tierIndex].label,
        bands: std.bands,
        value: std.value,
        unit: std.unit,
        source: std.source,
        nextText,
        score,
      },
      focusText,
    };
  })();

  // --- current-period dimensions -------------------------------------------
  const activityBuild = period
    ? buildActivityDim(period.logs, periodWeeks)
    : buildActivityDim(allLogs.filter((l) => l.date && l.date >= daysAgoString(28)), 4);
  const consistencyBuild = period
    ? buildConsistencyDim(period.logs, periodWeeks)
    : buildConsistencyDim(allLogs.filter((l) => l.date && l.date >= cutoff56), 8);
  const progressionBuild = period
    ? buildProgressionDim(allPRs, period.start, period.end, periodWeeks, `PR (${period.label})`)
    : buildProgressionDim(allPRs, cutoff56, today, 8, 'PR/8 tuần');

  // --- composite (current period) ------------------------------------------
  const dimBuilds: DimBuild[] = [strengthBuild, activityBuild, consistencyBuild, bodyBuild, progressionBuild];
  const { score, weights } = composite(dimBuilds);

  const tierIndex = tierFor(score, OVERALL_BANDS);
  const level = OVERALL_BANDS[tierIndex].label;
  const emoji = OVERALL_EMOJI[tierIndex];
  const overallNextText = nextMilestoneText(score, OVERALL_BANDS, 'điểm', tierIndex);
  const overall: AssessmentDimension = {
    key: 'overall',
    label: 'Điểm thể lực tổng hợp',
    valueText: `${score}/100`,
    tierLabel: level,
    bands: OVERALL_BANDS,
    value: score,
    unit: 'điểm',
    source: 'Quy ước tổng hợp trong app (không phải chứng chỉ) — trung bình có trọng số từ 5 tiêu chí bên dưới',
    nextText: overallNextText,
    score,
  };

  // --- composite (previous period, for the week-over-week delta) -----------
  // Reuses the SAME strengthBuild/bodyBuild objects as the current-period
  // composite so both sides always share identical hasData/weights for those
  // two dimensions — the delta is driven purely by activity/consistency/
  // progression, which is what should actually move week to week. Only
  // computed when the caller passed real previous-period data (an empty
  // prevLogs means "kỳ trước chưa tập", shown as null rather than a
  // misleading low score).
  let prevScore: number | null = null;
  let prevLevel: string | null = null;
  if (period && period.prevLogs.length > 0) {
    const prevWeeks = Math.max(1, period.prevDays) / 7;
    const prevActivityBuild = buildActivityDim(period.prevLogs, prevWeeks);
    const prevConsistencyBuild = buildConsistencyDim(period.prevLogs, prevWeeks);
    const prevProgressionBuild = buildProgressionDim(
      allPRs,
      period.prevStart,
      period.prevEnd,
      prevWeeks,
      `PR (${period.label} trước)`
    );
    const prevComposite = composite([strengthBuild, prevActivityBuild, prevConsistencyBuild, bodyBuild, prevProgressionBuild]);
    prevScore = prevComposite.score;
    prevLevel = levelForScore(prevScore).level;
  }

  // Weakest dimension among those with real data (consistency/activity/
  // progression always have data, so this is never empty).
  const scoredDims = dimBuilds.filter((d) => d.hasData);
  const weakest = (scoredDims.length > 0 ? scoredDims : dimBuilds).reduce((a, b) => (b.dimension.score < a.dimension.score ? b : a));
  const focus = `🎯 ${weakest.focusText}`;

  // --- trend line: selected period vs previous period (prorated to the same
  // elapsed-day count so a period still in progress isn't compared against a
  // full previous period). Falls back to a 7-day vs prior-7-day window when no
  // period is supplied. Independent of prevScore/prevLevel above (this line
  // trends raw sessions/minutes; prevScore trends the composite itself). -----
  const trendLabel = period ? period.label : '7 ngày qua';
  const curLogs = period ? period.logs : allLogs.filter((l) => l.date && l.date >= daysAgoString(7));
  const prvLogs = period
    ? period.prevLogs
    : allLogs.filter((l) => l.date && l.date >= daysAgoString(14) && l.date < daysAgoString(7));
  const prorate = period && period.prevDays > 0 ? period.days / period.prevDays : 1;

  let weekLine: string;
  {
    const sessions = curLogs.length;
    const minutes = Math.round(curLogs.reduce((s, l) => s + logMinutes(l), 0));
    const prevSessions = Math.round(prvLogs.length * prorate);
    const prevMinutes = Math.round(prvLogs.reduce((s, l) => s + logMinutes(l), 0) * prorate);

    if (prevSessions === 0 && prevMinutes === 0) {
      weekLine = `📈 ${trendLabel}: ${sessions} buổi · ${minutes} phút — kỳ trước chưa tập`;
    } else {
      const sessDelta = sessions - prevSessions;
      const minDelta = minutes - prevMinutes;
      const trendUp = minDelta > 0 || (minDelta === 0 && sessDelta >= 0);
      const trendEmoji = trendUp ? '📈' : '📉';
      const verb = trendUp ? 'hơn' : 'kém';
      const sessPart = sessDelta === 0 ? 'bằng kỳ trước về số buổi' : `${verb} kỳ trước ${Math.abs(sessDelta)} buổi`;
      const minPart = `${minDelta >= 0 ? '+' : ''}${minDelta} phút`;
      weekLine = `${trendEmoji} ${trendLabel}: ${sessions} buổi · ${minutes} phút — ${sessPart}, ${minPart}`;
    }
  }

  const methodNote = `${ENERGY_METHOD_NOTE} · Chuẩn: ExRx/ACSM (sức mạnh), WHO 2020 (vận động), BMI châu Á – Bộ Y tế VN`;
  const scopeNote = period
    ? `Vận động · Đều đặn · Tiến bộ tính theo kỳ "${period.label}". Sức mạnh (năng lực tích luỹ) và Vóc dáng (BMI hiện tại) là trạng thái hiện tại, không đổi theo kỳ.`
    : 'Sức mạnh & Vóc dáng là trạng thái hiện tại; Vận động · Đều đặn · Tiến bộ theo cửa sổ gần đây.';

  return {
    score,
    level,
    emoji,
    prevScore,
    prevLevel,
    overall,
    weights,
    dimensions: dimBuilds.map((d) => d.dimension),
    weekLine,
    focus,
    needsProfile,
    methodNote,
    scopeNote,
  };
}
