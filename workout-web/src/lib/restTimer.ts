// Rest timer between sets — Strong/Hevy-style manual countdown. Kept as pure,
// easily testable helpers; the React widget (components/RestTimerWidget.tsx)
// only owns the setInterval tick and calls into these.

export const REST_PRESETS_SECONDS = [30, 60, 90, 120] as const;

export const REST_MIN_SECONDS = 5;
export const REST_MAX_SECONDS = 600; // 10 phút — đủ cho nghỉ giữa hiệp tạ nặng

export function clampRestSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return REST_PRESETS_SECONDS[0];
  return Math.max(REST_MIN_SECONDS, Math.min(REST_MAX_SECONDS, Math.round(seconds)));
}

// endAt/now are epoch ms. Using an absolute end timestamp (not a decrementing
// counter) means the countdown self-corrects after the tab is backgrounded —
// setInterval throttles in background tabs, but Date.now() doesn't drift.
export function computeRemainingSeconds(endAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function addSecondsToEnd(endAt: number, deltaSeconds: number, now: number = Date.now()): number {
  const remaining = computeRemainingSeconds(endAt, now);
  const next = clampRestSeconds(remaining + deltaSeconds);
  return now + next * 1000;
}
