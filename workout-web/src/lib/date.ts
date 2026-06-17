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

export function getWeekLabel(dateStr: string): string {
  const todayStr = todayString();
  const { week: tw, year: ty } = getISOWeek(todayStr);
  const { week: dw, year: dy } = getISOWeek(dateStr);
  if (ty === dy && tw === dw) return 'Tuần này';
  if (ty === dy && tw - 1 === dw) return 'Tuần trước';
  const d = new Date(dateStr + 'T00:00:00');
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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
