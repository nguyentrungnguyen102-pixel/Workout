// U.S. Navy circumference method for estimating body-fat %.
// Source: Hodgdon & Beckett (1984), Naval Health Research Center — the
// formula still used by the US Navy body-composition assessment and widely
// re-published (ACE, ExRx). All measurements in cm; returns null instead of
// a fabricated number whenever a required input is missing or the log10
// domain would be invalid (e.g. waist <= neck).

export type BodyFatSex = 'male' | 'female';

export interface NavyBodyFatInput {
  sex: BodyFatSex;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number; // required for female, ignored for male
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function estimateBodyFatNavy(input: NavyBodyFatInput): number | null {
  const { sex, heightCm, waistCm, neckCm, hipCm } = input;
  if (!(heightCm > 0) || !(waistCm > 0) || !(neckCm > 0)) return null;

  let pct: number;
  if (sex === 'male') {
    const diff = waistCm - neckCm;
    if (!(diff > 0)) return null;
    pct = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!(hipCm !== undefined && hipCm > 0)) return null;
    const sum = waistCm + hipCm - neckCm;
    if (!(sum > 0)) return null;
    pct = 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.221 * Math.log10(heightCm)) - 450;
  }

  if (!Number.isFinite(pct)) return null;
  return round1(pct);
}
