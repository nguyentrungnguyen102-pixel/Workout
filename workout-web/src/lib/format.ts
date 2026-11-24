import { Timestamp } from 'firebase/firestore';

export function formatAmount(ex: { unit: string; reps?: number; durationSeconds?: number; distance?: number }): string {
  if (ex.unit === 'reps') return `${ex.reps ?? 0} cái`;
  if (ex.unit === 'seconds') return `${ex.durationSeconds ?? 0} giây`;
  if (ex.unit === 'minutes') return `${Math.round((ex.durationSeconds ?? 0) / 60)} phút`;
  if (ex.unit === 'km') return `${ex.distance ?? 0} km`;
  return `${ex.reps ?? 0}`;
}

export function formatTime24(ts: Timestamp | undefined | null): string | null {
  if (!ts) return null;
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Live workout-session clock (Strong/Hevy-style "0:12:34" while logging) —
// clamps negative input (clock skew from an edited "Thời gian tập") to 0
// instead of rendering a negative duration.
export function formatElapsedClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Same as formatAmount but appends the dumbbell load when one was logged
// ("12 cái · 6 kg"). Used on detail screens where the kg entered on the
// logging screen was previously never shown back to the user.
export function formatAmountWithWeight(ex: { unit: string; reps?: number; durationSeconds?: number; distance?: number; weight?: number }): string {
  const base = formatAmount(ex);
  return ex.weight !== undefined && ex.weight > 0 ? `${base} · ${ex.weight} kg` : base;
}
