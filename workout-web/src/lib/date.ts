export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round(Math.abs((db.getTime() - da.getTime()) / 86_400_000));
}

export function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDayOfWeekVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[d.getDay()];
}

export function getISOWeek(dateStr: string): { week: number; year: number } {
  const d = new Date(dateStr + 'T00:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { week, year: thursday.getFullYear() };
}

function mondayOf(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00');
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday;
}

export function getWeekLabel(dateStr: string): string {
  // Compare Monday-of-week by elapsed days rather than ISO week+year, since
  // ISO week numbers reset at each year boundary and "week N of year Y" vs
  // "week N-1 of year Y" breaks around New Year's (e.g. week 1 of 2026 vs
  // week 52 of 2025 are consecutive weeks but have different `year`).
  const todayMonday = mondayOf(todayString());
  const monday = mondayOf(dateStr);
  const diffDays = Math.round((todayMonday.getTime() - monday.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Tuần này';
  if (diffDays === 7) return 'Tuần trước';
  return `Tuần ${monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

export function formatTimeOfDay(ts: import('firebase/firestore').Timestamp | undefined | null): string | null {
  if (!ts) return null;
  const d = ts.toDate();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? 'SA' : h < 18 ? 'CH' : 'TT';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}
