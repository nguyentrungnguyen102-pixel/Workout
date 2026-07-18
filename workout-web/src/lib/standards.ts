// Published fitness-standard evaluators. Each function scores a raw
// measurement against a full low->high scale (Band[]) so the UI can render
// "you're here, this is what's next" rather than a single pass/fail.
//
// IMPORTANT: this module intentionally does NOT touch coach.ts /
// CoachInsights.tsx — those are wired up in a later wave. This wave only
// provides the evaluators + compiles cleanly.

export interface Band {
  label: string;
  min: number; // lower threshold (inclusive) to reach this band
}

export interface StandardResult {
  value: number;
  unit: string;
  bands: Band[]; // ordered low -> high
  tierIndex: number; // 0-based index into bands the value currently falls in
  source: string; // citation for the table used
  nextMilestone?: { toLabel: string; need: number };
}

const TIER_LABELS = ['Kém', 'Dưới TB', 'Trung bình', 'Tốt', 'Xuất sắc'];

export type SexKey = 'male' | 'female';

export type AgeBandKey = '18-29' | '30-39' | '40-49' | '50-59' | '60+';

export const AGE_BANDS: AgeBandKey[] = ['18-29', '30-39', '40-49', '50-59', '60+'];

export function ageFromBirthYear(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function ageBandKey(age: number): AgeBandKey {
  if (age < 30) return '18-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60+';
}

// Builds a StandardResult from 5 ascending lower-thresholds (Kém..Xuất sắc)
// and the achieved value.
function buildTiered(value: number, unit: string, thresholds: number[], source: string): StandardResult {
  const bands: Band[] = TIER_LABELS.map((label, i) => ({ label, min: thresholds[i] }));
  let tierIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) tierIndex = i;
  }
  let nextMilestone: StandardResult['nextMilestone'];
  if (tierIndex < thresholds.length - 1) {
    const need = Math.round((thresholds[tierIndex + 1] - value) * 10) / 10;
    nextMilestone = { toLabel: TIER_LABELS[tierIndex + 1], need: Math.max(0, need) };
  }
  return { value, unit, bands, tierIndex, source, nextMilestone };
}

// ---------------------------------------------------------------------
// Push-up test norms (max reps).
// Source: ACSM push-up test norms, as commonly cited via ExRx.net / Topend
// Sports fitness-testing references.
// TODO verify exact cutoffs vs ACSM's Guidelines for Exercise Testing and
// Prescription (current edition) — these are defensible, commonly-cited
// approximations, not a verbatim transcription of the primary source.
const PUSHUP_NORMS: Record<SexKey, Record<AgeBandKey, number[]>> = {
  male: {
    '18-29': [0, 15, 30, 45, 60],
    '30-39': [0, 12, 25, 40, 55],
    '40-49': [0, 10, 20, 35, 45],
    '50-59': [0, 8, 17, 30, 40],
    '60+': [0, 6, 15, 25, 35],
  },
  female: {
    '18-29': [0, 10, 20, 30, 41],
    '30-39': [0, 8, 16, 24, 31],
    '40-49': [0, 6, 13, 20, 28],
    '50-59': [0, 5, 11, 17, 24],
    '60+': [0, 3, 8, 13, 19],
  },
};

// ---------------------------------------------------------------------
// 1-minute curl-up / sit-up test norms (max reps in 60s).
// Source: Cooper Institute / ACSM curl-up test norms, as commonly cited via
// Topend Sports / YMCA fitness-testing references.
// TODO verify exact cutoffs vs the primary Cooper/ACSM tables.
const SITUP_NORMS: Record<SexKey, Record<AgeBandKey, number[]>> = {
  male: {
    '18-29': [0, 25, 35, 45, 55],
    '30-39': [0, 22, 32, 41, 50],
    '40-49': [0, 18, 27, 35, 45],
    '50-59': [0, 14, 22, 30, 40],
    '60+': [0, 10, 17, 25, 33],
  },
  female: {
    '18-29': [0, 20, 30, 39, 49],
    '30-39': [0, 18, 26, 34, 43],
    '40-49': [0, 15, 22, 29, 37],
    '50-59': [0, 12, 19, 25, 33],
    '60+': [0, 8, 14, 20, 27],
  },
};

// ---------------------------------------------------------------------
// Plank hold norms (seconds). Common plank-hold benchmarks as popularized
// by ACE/Openfit-style fitness-testing guides. Deliberately NOT split by
// sex/age band — the commonly-cited versions of this test don't split
// either, unlike push-up/sit-up which have long-standing ACSM tables.
// TODO verify vs a primary published source (this test is less rigorously
// standardized than push-up/sit-up).
const PLANK_NORMS: number[] = [0, 30, 60, 90, 120];

// ---------------------------------------------------------------------
// Bodyweight squat endurance norms (max reps, informal 1-minute-style
// test). Source: commonly-cited bodyweight squat test tables (e.g. Topend
// Sports). TODO verify — of the four exercises covered here, this one has
// the weakest standardization; treat these cutoffs as the least reliable.
const SQUAT_NORMS: Record<SexKey, Record<AgeBandKey, number[]>> = {
  male: {
    '18-29': [0, 20, 30, 40, 50],
    '30-39': [0, 18, 27, 36, 45],
    '40-49': [0, 15, 23, 31, 40],
    '50-59': [0, 12, 19, 26, 34],
    '60+': [0, 9, 15, 21, 28],
  },
  female: {
    '18-29': [0, 15, 24, 33, 43],
    '30-39': [0, 13, 21, 29, 38],
    '40-49': [0, 11, 18, 25, 33],
    '50-59': [0, 9, 15, 21, 28],
    '60+': [0, 6, 11, 16, 22],
  },
};

/**
 * Score a best-effort measurement against a published (or commonly-cited)
 * field-test norm table, sex- and age-banded. Returns null for exercises
 * without a defensible published norm — callers should skip the exercise
 * or show it without a scored standard rather than fabricate one.
 */
export function strengthStandard(
  presetId: string,
  best: number,
  sex: SexKey,
  age: number
): StandardResult | null {
  const band = ageBandKey(age);
  switch (presetId) {
    case 'pushup':
      return buildTiered(
        best,
        'cái',
        PUSHUP_NORMS[sex][band],
        'Nguồn: ACSM push-up test norms (dẫn theo ExRx.net/Topend Sports) — TODO verify cutoffs chính xác'
      );
    case 'situp':
    case 'crunch':
      return buildTiered(
        best,
        'cái',
        SITUP_NORMS[sex][band],
        'Nguồn: Cooper Institute/ACSM 1-minute curl-up test norms (dẫn theo Topend Sports) — TODO verify cutoffs chính xác'
      );
    case 'plank':
      return buildTiered(
        best,
        'giây',
        PLANK_NORMS,
        'Nguồn: Chuẩn plank hold phổ biến (kiểu ACE/Openfit), không phân biệt giới tính/độ tuổi — TODO verify nguồn gốc'
      );
    case 'squat':
      return buildTiered(
        best,
        'cái',
        SQUAT_NORMS[sex][band],
        'Nguồn: Bodyweight squat test — chuẩn tham khảo phổ biến (Topend Sports) — TODO verify, độ tin cậy thấp hơn push-up/sit-up'
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------
// BMI — Asian / Vietnam Ministry of Health cutoffs (lower than the WHO
// global 25/30 cutoffs, reflecting higher body-fat % at a given BMI in
// Asian populations).
// Source: WHO Western Pacific Region (2000) "The Asia-Pacific Perspective:
// Redefining Obesity and its Treatment" / Bộ Y tế Việt Nam.
export function bmiStandard(weightKg: number, heightCm: number): StandardResult {
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
  const bands: Band[] = [
    { label: 'Thiếu cân', min: 0 },
    { label: 'Bình thường', min: 18.5 },
    { label: 'Thừa cân', min: 23 },
    { label: 'Béo phì', min: 25 },
  ];
  let tierIndex = 0;
  bands.forEach((b, i) => {
    if (bmi >= b.min) tierIndex = i;
  });
  let nextMilestone: StandardResult['nextMilestone'];
  if (tierIndex < bands.length - 1) {
    const need = Math.round((bands[tierIndex + 1].min - bmi) * 10) / 10;
    nextMilestone = { toLabel: bands[tierIndex + 1].label, need };
  }
  return {
    value: Math.round(bmi * 10) / 10,
    unit: 'kg/m²',
    bands,
    tierIndex,
    source:
      'Nguồn: WHO Western Pacific 2000 / Bộ Y tế VN (ngưỡng BMI châu Á, khác WHO toàn cầu 25/30)',
    nextMilestone,
  };
}

// ---------------------------------------------------------------------
// WHO 2020 physical-activity guideline: 150-300 min/week of moderate
// activity (or equivalent) plus >=2 strength-training days/week.
// Source: WHO Guidelines on Physical Activity and Sedentary Behaviour
// (2020).
export function whoActivityStandard(
  metMinutesPerWeek: number,
  strengthDaysPerWeek: number
): StandardResult {
  const bands: Band[] = [
    { label: 'Dưới chuẩn', min: 0 },
    { label: 'Đạt chuẩn', min: 150 },
    { label: 'Tối ưu', min: 300 },
  ];
  let tierIndex = 0;
  bands.forEach((b, i) => {
    if (metMinutesPerWeek >= b.min) tierIndex = i;
  });
  let nextMilestone: StandardResult['nextMilestone'];
  if (tierIndex < bands.length - 1) {
    const need = Math.max(0, Math.round(bands[tierIndex + 1].min - metMinutesPerWeek));
    nextMilestone = { toLabel: bands[tierIndex + 1].label, need };
  }
  // WHO's 2nd criterion (>=2 strength days/week) isn't itself a graded
  // minute-scale, so it's folded into the source string rather than a
  // separate band — the caller/UI can still read strengthDaysPerWeek
  // directly if it wants to show it on its own.
  const strengthNote =
    strengthDaysPerWeek >= 2
      ? `đã đạt ≥2 buổi tăng cơ/tuần (${strengthDaysPerWeek})`
      : `mới ${strengthDaysPerWeek} buổi tăng cơ/tuần (khuyến nghị ≥2)`;
  return {
    value: Math.round(metMinutesPerWeek),
    unit: 'phút/tuần',
    bands,
    tierIndex,
    source: `Nguồn: WHO Physical Activity Guidelines 2020 (150-300 phút/tuần cường độ vừa + ≥2 buổi tăng cơ/tuần) — ${strengthNote}`,
    nextMilestone,
  };
}
