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

export interface AssessmentDimension {
  key: 'strength' | 'activity' | 'consistency' | 'body' | 'progression';
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
// and stay the same across periods.
export interface AssessmentPeriod {
  logs: WorkoutLog[];
  prevLogs: WorkoutLog[];
  label: string;
  days: number;
  prevDays: number;
  start: string;
  end: string;
}

const BASE_WEIGHTS: Record<AssessmentDimension['key'], number> = {
  strength: 35,
  activity: 20,
  consistency: 20,
  body: 15,
  progression: 10,
};

const DIMENSION_LABELS: Record<AssessmentDimension['key'], string> = {
  strength: 'Sức mạnh',
  activity: 'Vận động (WHO)',
  consistency: 'Đều đặn',
  body: 'Vóc dáng',
  progression: 'Tiến bộ',
};

interface DimBuild {
  dimension: AssessmentDimension;
  hasData: boolean;
  focusText: string;
}

// Generic ascending-band tier lookup for the two in-app heuristic
// dimensions (consistency/progression) that aren't backed by a
// standards.ts published table — higher value is always better for both.
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

  // --- strength ---------------------------------------------------------
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
    // (most-practiced) standardized lift as the headline value.
    const freq = new Map<string, number>();
    for (const log of allLogs) {
      const presetsInLog = new Set((log.exercises || []).map((ex) => ex.presetId));
      for (const pid of presetsInLog) freq.set(pid, (freq.get(pid) || 0) + 1);
    }

    const matched: { pr: PersonalRecord; std: NonNullable<ReturnType<typeof strengthStandard>>; freq: number }[] = [];
    for (const pr of allPRs) {
      const best = pr.unit === 'seconds' ? pr.bestDurationSeconds : pr.bestReps;
      if (!best) continue;
      const std = strengthStandard(pr.presetId, best, sex, age);
      if (!std) continue;
      matched.push({ pr, std, freq: freq.get(pr.presetId) || 0 });
    }

    if (matched.length === 0) {
      return {
        hasData: false,
        dimension: {
          key: 'strength',
          label,
          valueText: 'Chưa có bài có chuẩn (hít đất, gập bụng, plank, squat)',
          tierLabel: 'Chưa đủ dữ liệu',
          bands: [],
          value: 0,
          unit: '',
          source: 'Nguồn: ExRx/ACSM push-up/sit-up/plank/squat norms',
          score: 0,
        },
        focusText: 'Tập thêm hít đất, gập bụng, plank hoặc squat để có chuẩn chấm sức mạnh.',
      };
    }

    matched.sort((a, b) => b.freq - a.freq || b.std.tierIndex - a.std.tierIndex);
    const primary = matched[0];
    const score = matched.reduce((s, m) => s + (m.std.tierIndex / (m.std.bands.length - 1)) * 100, 0) / matched.length;
    const nextText = primary.std.nextMilestone
      ? `cần +${primary.std.nextMilestone.need} ${primary.std.unit} để đạt ${primary.std.nextMilestone.toLabel}`
      : undefined;

    return {
      hasData: true,
      dimension: {
        key: 'strength',
        label,
        valueText: `${primary.pr.name} ${primary.std.value} ${primary.std.unit}`,
        tierLabel: primary.std.bands[primary.std.tierIndex].label,
        bands: primary.std.bands,
        value: primary.std.value,
        unit: primary.std.unit,
        source: primary.std.source,
        nextText,
        score,
      },
      focusText: primary.std.nextMilestone
        ? `Đẩy ${primary.pr.name} thêm ${primary.std.nextMilestone.need} ${primary.std.unit} để đạt mốc ${primary.std.nextMilestone.toLabel}.`
        : `${primary.pr.name} đã đạt mốc cao nhất (${primary.std.bands[primary.std.tierIndex].label}) — thử thêm bài mới để mở rộng thế mạnh.`,
    };
  })();

  // --- activity (WHO) — over the selected period, normalized per week -----
  const activityBuild: DimBuild = (() => {
    const aLogs = period ? period.logs : allLogs.filter((l) => l.date && l.date >= daysAgoString(28));
    const aWeeks = period ? periodWeeks : 4;
    const weeklyMinutes = aLogs.reduce((s, l) => s + logMinutes(l), 0) / aWeeks;

    const strengthDates = new Set<string>();
    for (const log of aLogs) {
      if (!log.date) continue;
      const hasStrength = (log.exercises || []).some((ex) => ex.category === 'strength' || ex.category === 'dumbbell');
      if (hasStrength) strengthDates.add(log.date);
    }
    const strengthDaysPerWeek = strengthDates.size / aWeeks;

    const std = whoActivityStandard(weeklyMinutes, strengthDaysPerWeek);
    const score = (std.tierIndex / (std.bands.length - 1)) * 100;
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
  })();

  // --- consistency (in-app heuristic, not an external standard) -----------
  const consistencyBuild: DimBuild = (() => {
    const cLogs = period ? period.logs : allLogs.filter((l) => l.date && l.date >= cutoff56);
    const cWeeks = period ? periodWeeks : 8;
    const avgSessionsPerWeek = cLogs.length / cWeeks;
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
  })();

  // --- body (BMI, Asian/VN cutoffs) ---------------------------------------
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

  // --- progression (in-app heuristic: PRs within the period) --------------
  const progressionBuild: DimBuild = (() => {
    const prCount = period
      ? allPRs.filter((pr) => pr.achievedDate >= period.start && pr.achievedDate <= period.end).length
      : allPRs.filter((pr) => pr.achievedDate >= cutoff56).length;
    const wks = period ? periodWeeks : 8;
    // Bands scale with the period length: ~1 PR = making progress, ~1 PR/2wk =
    // breaking through. Keeps thresholds fair for a week vs a quarter.
    const bandUnit = period ? `PR (${period.label})` : 'PR/8 tuần';
    const bands: Band[] = [
      { label: 'Chững', min: 0 },
      { label: 'Tiến bộ', min: 1 },
      { label: 'Bứt phá', min: Math.max(2, Math.round(wks / 2)) },
    ];
    const tierIndex = tierFor(prCount, bands);
    // 1 PR per 2 weeks → 100.
    const score = Math.min(100, (prCount / Math.max(1, wks / 2)) * 100);
    const nextText = nextMilestoneText(prCount, bands, 'PR', tierIndex);

    let focusText: string;
    if (nextText) {
      focusText = `Cần thêm ${bands[tierIndex + 1].min - prCount} PR để đạt mốc ${bands[tierIndex + 1].label}.`;
    } else if (allPRs.length === 0) {
      focusText = 'Chưa có PR nào — chọn 1 bài để phá mốc.';
    } else {
      const mostRecent = allPRs.reduce((a, b) => (b.achievedDate > a.achievedDate ? b : a));
      const weeksSince = Math.floor(daysBetween(mostRecent.achievedDate, today) / 7);
      focusText = `${weeksSince} tuần chưa có PR mới — tăng nhẹ tải để phá mốc.`;
    }

    return {
      hasData: true,
      dimension: {
        key: 'progression',
        label: DIMENSION_LABELS.progression,
        valueText: `${prCount} ${bandUnit}`,
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
  })();

  // --- composite ------------------------------------------------------
  const dimBuilds: DimBuild[] = [strengthBuild, activityBuild, consistencyBuild, bodyBuild, progressionBuild];
  const totalWeight = dimBuilds.reduce((s, d) => s + (d.hasData ? BASE_WEIGHTS[d.dimension.key] : 0), 0);
  const score =
    totalWeight > 0
      ? Math.round(
          dimBuilds.reduce((s, d) => s + (d.hasData ? d.dimension.score * BASE_WEIGHTS[d.dimension.key] : 0), 0) / totalWeight
        )
      : 0;

  const weights = dimBuilds
    .filter((d) => d.hasData)
    .map((d) => ({
      key: d.dimension.key,
      label: d.dimension.label,
      pct: Math.round((BASE_WEIGHTS[d.dimension.key] / totalWeight) * 100),
    }));

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
    level = 'Tốt';
    emoji = '🏅';
  } else {
    level = 'Xuất sắc';
    emoji = '🏆';
  }

  // Weakest dimension among those with real data (consistency/activity/
  // progression always have data, so this is never empty).
  const scoredDims = dimBuilds.filter((d) => d.hasData);
  const weakest = (scoredDims.length > 0 ? scoredDims : dimBuilds).reduce((a, b) => (b.dimension.score < a.dimension.score ? b : a));
  const focus = `🎯 ${weakest.focusText}`;

  // --- trend line: selected period vs previous period (prorated to the same
  // elapsed-day count so a period still in progress isn't compared against a
  // full previous period). Falls back to a 7-day vs prior-7-day window when no
  // period is supplied. -----------------------------------------------------
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
    weights,
    dimensions: dimBuilds.map((d) => d.dimension),
    weekLine,
    focus,
    needsProfile,
    methodNote,
    scopeNote,
  };
}
