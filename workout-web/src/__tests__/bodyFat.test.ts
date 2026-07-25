import { describe, it, expect } from 'vitest';
import { estimateBodyFatNavy } from '../lib/bodyFat';
import { bodyFatStandard } from '../lib/standards';

describe('estimateBodyFatNavy', () => {
  it('male 85cm waist / 38cm neck / 180cm height ~16.1%', () => {
    const pct = estimateBodyFatNavy({ sex: 'male', heightCm: 180, waistCm: 85, neckCm: 38 });
    expect(pct).toBeCloseTo(16.1, 1);
  });

  it('female 75cm waist / 33cm neck / 165cm height / 95cm hip ~26.9%', () => {
    const pct = estimateBodyFatNavy({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33, hipCm: 95 });
    expect(pct).toBeCloseTo(26.9, 1);
  });

  it('returns null for female missing hip (required input)', () => {
    const pct = estimateBodyFatNavy({ sex: 'female', heightCm: 165, waistCm: 75, neckCm: 33 });
    expect(pct).toBeNull();
  });

  it('returns null when waist <= neck (invalid log10 domain for male)', () => {
    const pct = estimateBodyFatNavy({ sex: 'male', heightCm: 180, waistCm: 35, neckCm: 38 });
    expect(pct).toBeNull();
  });

  it('returns null when waist + hip <= neck (invalid log10 domain for female)', () => {
    const pct = estimateBodyFatNavy({ sex: 'female', heightCm: 165, waistCm: 10, neckCm: 33, hipCm: 5 });
    expect(pct).toBeNull();
  });

  it('returns null for non-positive height/waist/neck', () => {
    expect(estimateBodyFatNavy({ sex: 'male', heightCm: 0, waistCm: 85, neckCm: 38 })).toBeNull();
    expect(estimateBodyFatNavy({ sex: 'male', heightCm: 180, waistCm: -5, neckCm: 38 })).toBeNull();
  });
});

describe('bodyFatStandard', () => {
  it('classifies male 16.1% as Thể hình (fitness tier)', () => {
    const std = bodyFatStandard(16.1, 'male');
    expect(std.bands[std.tierIndex].label).toBe('Thể hình');
  });

  it('classifies male 5% as the essential-fat floor tier', () => {
    const std = bodyFatStandard(5, 'male');
    expect(std.bands[std.tierIndex].label).toBe('Mỡ thiết yếu');
  });

  it('classifies female 26.9% as Trung bình (average)', () => {
    const std = bodyFatStandard(26.9, 'female');
    expect(std.bands[std.tierIndex].label).toBe('Trung bình');
  });

  it('classifies male 30% as Cao (obese tier)', () => {
    const std = bodyFatStandard(30, 'male');
    expect(std.bands[std.tierIndex].label).toBe('Cao');
  });
});
