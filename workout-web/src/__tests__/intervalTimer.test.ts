import { describe, it, expect } from 'vitest';
import {
  buildSchedule, totalDurationSec, workDurationSec, timerStateAt, workDoneSec,
  completedRounds, normalizeConfig, formatClock, describeConfig, INTERVAL_PRESETS,
} from '../lib/intervalTimer';

const tabata = INTERVAL_PRESETS.find((p) => p.id === 'tabata')!.config;
const emom = INTERVAL_PRESETS.find((p) => p.id === 'emom')!.config;

describe('buildSchedule', () => {
  it('Tabata = 10s prep + 8×20s work + 7×10s rest (no trailing rest)', () => {
    const s = buildSchedule(tabata);
    expect(s[0]).toMatchObject({ kind: 'prep', durationSec: 10, startSec: 0 });
    expect(s.filter((x) => x.kind === 'work')).toHaveLength(8);
    expect(s.filter((x) => x.kind === 'rest')).toHaveLength(7);
    expect(s[s.length - 1].kind).toBe('work');
    expect(totalDurationSec(s)).toBe(10 + 160 + 70);
    expect(workDurationSec(s)).toBe(160);
  });

  it('segments are contiguous', () => {
    const s = buildSchedule(tabata);
    for (let i = 1; i < s.length; i++) {
      expect(s[i].startSec).toBe(s[i - 1].startSec + s[i - 1].durationSec);
    }
  });

  it('EMOM has no rest segments and ignores restSec', () => {
    const s = buildSchedule({ ...emom, restSec: 30 });
    expect(s.some((x) => x.kind === 'rest')).toBe(false);
    expect(workDurationSec(s)).toBe(600);
  });

  it('prepSec 0 and restSec 0 produce no empty segments', () => {
    const s = buildSchedule({ mode: 'custom', workSec: 30, restSec: 0, rounds: 3, prepSec: 0 });
    expect(s).toHaveLength(3);
    expect(s.every((x) => x.durationSec > 0)).toBe(true);
  });
});

describe('normalizeConfig', () => {
  it('clamps NaN/negative/huge input into limits', () => {
    const c = normalizeConfig({ mode: 'custom', workSec: NaN, restSec: -5, rounds: 999, prepSec: 100 });
    expect(c.workSec).toBe(5);
    expect(c.restSec).toBe(0);
    expect(c.rounds).toBe(50);
    expect(c.prepSec).toBe(30);
  });
});

describe('timerStateAt', () => {
  const s = buildSchedule(tabata);
  it('starts in prep with full countdown', () => {
    const st = timerStateAt(s, 0);
    expect(st.segment?.kind).toBe('prep');
    expect(st.remainingSec).toBe(10);
  });
  it('switches to work round 1 exactly at 10s', () => {
    const st = timerStateAt(s, 10_000);
    expect(st.segment).toMatchObject({ kind: 'work', round: 1 });
    expect(st.remainingSec).toBe(20);
  });
  it('rounds remaining up (9.5s left shows 10)', () => {
    expect(timerStateAt(s, 10_500).remainingSec).toBe(20);
    expect(timerStateAt(s, 29_500).remainingSec).toBe(1);
  });
  it('rest after round 1 at 30s', () => {
    expect(timerStateAt(s, 30_000).segment).toMatchObject({ kind: 'rest', round: 1 });
  });
  it('finishes at total duration and beyond (e.g. after background throttling)', () => {
    expect(timerStateAt(s, 240_000).finished).toBe(true);
    expect(timerStateAt(s, 10_000_000).finished).toBe(true);
    expect(timerStateAt(s, 239_999).finished).toBe(false);
  });
  it('negative elapsed is treated as 0', () => {
    expect(timerStateAt(s, -500).segment?.kind).toBe('prep');
  });
  it('empty schedule is finished', () => {
    expect(timerStateAt([], 0).finished).toBe(true);
  });
});

describe('workDoneSec / completedRounds (stopping early)', () => {
  const s = buildSchedule(tabata);
  it('counts nothing during prep', () => {
    expect(workDoneSec(s, 5_000)).toBe(0);
    expect(completedRounds(s, 5_000)).toBe(0);
  });
  it('counts partial work of the current round', () => {
    expect(workDoneSec(s, 15_000)).toBe(5);
    expect(completedRounds(s, 15_000)).toBe(0);
  });
  it('excludes rest time', () => {
    // 10 prep + 20 work + 10 rest + 20 work = 60s → 40s work, 2 rounds
    expect(workDoneSec(s, 60_000)).toBe(40);
    expect(completedRounds(s, 60_000)).toBe(2);
  });
  it('full session equals workDurationSec', () => {
    expect(workDoneSec(s, 999_000)).toBe(workDurationSec(s));
    expect(completedRounds(s, 999_000)).toBe(8);
  });
});

describe('formatting', () => {
  it('formatClock', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(-3)).toBe('0:00');
  });
  it('describeConfig', () => {
    expect(describeConfig(tabata)).toBe('Tabata 20s/10s × 8 hiệp');
    expect(describeConfig(emom)).toBe('EMOM 10 phút');
  });
});

describe('describeConfig after customising', () => {
  it('custom mode reads as HIIT', () => {
    expect(describeConfig({ mode: 'custom', workSec: 30, restSec: 15, rounds: 6, prepSec: 10 })).toBe('HIIT 30s/15s × 6 hiệp');
  });
});
