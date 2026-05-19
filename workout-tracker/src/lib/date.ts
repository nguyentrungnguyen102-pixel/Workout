// Returns "YYYY-MM-DD" in local timezone — avoids UTC date shift bugs
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return toLocalDateString(new Date());
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

export function isToday(dateStr: string): boolean {
  return todayString() === dateStr;
}

export function isYesterday(dateStr: string): boolean {
  return yesterdayString() === dateStr;
}

export function getLast90Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return toLocalDateString(d);
}
