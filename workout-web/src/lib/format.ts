import { Timestamp } from 'firebase/firestore';

export function formatAmount(ex: {
  unit: string;
  reps?: number;
  durationSeconds?: number;
  distance?: number;
  sets?: number;
  weight?: number;
}): string {
  if (ex.unit === 'reps') {
    const setsLabel = ex.sets && ex.sets > 1 ? `${ex.sets}×` : '';
    const weightLabel = ex.weight ? ` · ${ex.weight}kg` : '';
    return `${setsLabel}${ex.reps ?? 0} cái${weightLabel}`;
  }
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
