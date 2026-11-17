// Interval timer (HIIT / Tabata / EMOM) — v2.35.0, Phase 18.
//
// Pure, framework-free logic so it can be unit-tested and so the page never
// has to "count down" by decrementing state on every tick. The page only
// remembers WHEN the session started (plus accumulated paused time) and asks
// `timerStateAt(schedule, elapsedMs)` what should be on screen. That keeps
// the clock correct when a mobile browser throttles setInterval in a
// background tab or the phone screen dims — the next tick simply jumps to
// the right segment instead of drifting.

export type IntervalMode = 'tabata' | 'emom' | 'custom';
export type SegmentKind = 'prep' | 'work' | 'rest';

export interface IntervalConfig {
  mode: IntervalMode;
  workSec: number;
  restSec: number; // ignored for EMOM (rest = remainder of the minute)
  rounds: number;
  prepSec: number;
}

export interface Segment {
  kind: SegmentKind;
  round: number; // 1-based; 0 for the prep countdown
  durationSec: number;
  startSec: number; // offset from session start
}

export interface TimerState {
  index: number; // -1 once finished
  segment: Segment | null;
  remainingSec: number; // whole seconds left in the current segment (ceil)
  elapsedSec: number;
  totalSec: number;
  finished: boolean;
}

export const LIMITS = {
  workSec: { min: 5, max: 600 },
  restSec: { min: 0, max: 600 },
  rounds: { min: 1, max: 50 },
  prepSec: { min: 0, max: 30 },
} as const;

export interface IntervalPreset {
  id: string;
  label: string;
  description: string;
  config: IntervalConfig;
}

// Defaults mirror the formats that the big guided-workout apps (Nike Training
// Club, Seconds/Interval Timer, Hevy's timer) ship out of the box.
export const INTERVAL_PRESETS: IntervalPreset[] = [
  {
    id: 'tabata',
    label: 'Tabata',
    description: '20s tập · 10s nghỉ · 8 hiệp (4 phút)',
    config: { mode: 'tabata', workSec: 20, restSec: 10, rounds: 8, prepSec: 10 },
  },
  {
    id: 'emom',
    label: 'EMOM',
    description: 'Mỗi phút bắt đầu 1 hiệp · 10 phút',
    config: { mode: 'emom', workSec: 60, restSec: 0, rounds: 10, prepSec: 10 },
  },
  {
    id: 'hiit_40_20',
    label: 'HIIT 40/20',
    description: '40s tập · 20s nghỉ · 10 hiệp (10 phút)',
    config: { mode: 'custom', workSec: 40, restSec: 20, rounds: 10, prepSec: 10 },
  },
  {
    id: 'custom',
    label: 'Tự chỉnh',
    description: 'Tự đặt thời gian tập/nghỉ/số hiệp',
    config: { mode: 'custom', workSec: 30, restSec: 15, rounds: 6, prepSec: 10 },
  },
];

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.round(v)));
}

// Sanitises user input (NaN, negatives, absurd values) into a config the
// schedule builder can always handle.
export function normalizeConfig(c: IntervalConfig): IntervalConfig {
  return {
    mode: c.mode,
    workSec: clampInt(c.workSec, LIMITS.workSec.min, LIMITS.workSec.max),
    restSec: c.mode === 'emom' ? 0 : clampInt(c.restSec, LIMITS.restSec.min, LIMITS.restSec.max),
    rounds: clampInt(c.rounds, LIMITS.rounds.min, LIMITS.rounds.max),
    prepSec: clampInt(c.prepSec, LIMITS.prepSec.min, LIMITS.prepSec.max),
  };
}

// Flattens a config into consecutive segments. No rest after the final work
// round — every mainstream interval timer ends the session on the last work
// bell rather than making you wait out a pointless trailing rest.
export function buildSchedule(raw: IntervalConfig): Segment[] {
  const c = normalizeConfig(raw);
  const segs: Segment[] = [];
  let t = 0;
  const push = (kind: SegmentKind, round: number, durationSec: number) => {
    if (durationSec <= 0) return;
    segs.push({ kind, round, durationSec, startSec: t });
    t += durationSec;
  };
  push('prep', 0, c.prepSec);
  for (let r = 1; r <= c.rounds; r++) {
    push('work', r, c.workSec);
    if (r < c.rounds) push('rest', r, c.restSec);
  }
  return segs;
}

export function totalDurationSec(schedule: Segment[]): number {
  const last = schedule[schedule.length - 1];
  return last ? last.startSec + last.durationSec : 0;
}

// Seconds of actual work (excludes prep + rest) — what gets logged, so the
// weekly-minutes / calorie numbers aren't inflated by standing still.
export function workDurationSec(schedule: Segment[]): number {
  return schedule.filter((s) => s.kind === 'work').reduce((a, s) => a + s.durationSec, 0);
}

export function timerStateAt(schedule: Segment[], elapsedMs: number): TimerState {
  const totalSec = totalDurationSec(schedule);
  const elapsedSec = Math.max(0, elapsedMs) / 1000;
  if (schedule.length === 0 || elapsedSec >= totalSec) {
    return { index: -1, segment: null, remainingSec: 0, elapsedSec: totalSec, totalSec, finished: true };
  }
  // Segments are few (≤ ~100), linear scan is fine.
  let index = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (elapsedSec >= schedule[i].startSec) index = i;
    else break;
  }
  const seg = schedule[index];
  const remaining = seg.startSec + seg.durationSec - elapsedSec;
  return {
    index,
    segment: seg,
    remainingSec: Math.max(0, Math.ceil(remaining - 1e-9)),
    elapsedSec,
    totalSec,
    finished: false,
  };
}

// Work done when the user stops early — counts only completed portions of
// work segments up to `elapsedMs`.
export function workDoneSec(schedule: Segment[], elapsedMs: number): number {
  const e = Math.max(0, elapsedMs) / 1000;
  let done = 0;
  for (const s of schedule) {
    if (s.kind !== 'work') continue;
    if (e <= s.startSec) break;
    done += Math.min(s.durationSec, e - s.startSec);
  }
  return Math.floor(done);
}

export function completedRounds(schedule: Segment[], elapsedMs: number): number {
  const e = Math.max(0, elapsedMs) / 1000;
  return schedule.filter((s) => s.kind === 'work' && e >= s.startSec + s.durationSec).length;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// Short human description used in the logged workout's notes.
export function describeConfig(raw: IntervalConfig): string {
  const c = normalizeConfig(raw);
  if (c.mode === 'emom') return `EMOM ${c.rounds} phút`;
  const name = c.mode === 'tabata' ? 'Tabata' : 'HIIT';
  return `${name} ${c.workSec}s/${c.restSec}s × ${c.rounds} hiệp`;
}
