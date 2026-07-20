import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WorkoutLog } from '../../types/workout';
import { exerciseMinutes } from '../../lib/energy';
import { getWeekLabel, todayString } from '../../lib/date';
import { CATEGORY_LABELS } from '../../constants/exercises';
import { CATEGORY_CHART_COLORS } from '../../constants/chartColors';

// Trend window — last N weeks, computed from the full log history (not the
// Tuần/Tháng/Quý period filter) so the weekly trend stays visible even when
// the user is looking at a single week.
const WEEKS_COUNT = 10;
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday (local) of the week containing `dateStr` — same (getDay()+6)%7
// convention used throughout the codebase (lib/date.ts, StatsPage.tsx).
function mondayOfDate(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - dow);
  return mon;
}

interface WeeklyVolumeChartProps {
  logs: WorkoutLog[];
}

export default function WeeklyVolumeChart({ logs }: WeeklyVolumeChartProps) {
  const chartData = useMemo(() => {
    const curMonday = mondayOfDate(todayString());
    const weeks: { start: string; end: string; label: string }[] = [];
    for (let i = WEEKS_COUNT - 1; i >= 0; i--) {
      const mon = new Date(curMonday);
      mon.setDate(curMonday.getDate() - i * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      weeks.push({ start: toDateStr(mon), end: toDateStr(sun), label: getWeekLabel(toDateStr(mon)) });
    }

    return weeks.map((w) => {
      const row: Record<string, string | number> = { label: w.label };
      for (const cat of CATEGORY_KEYS) row[cat] = 0;
      for (const log of logs) {
        if (!log.date || log.date < w.start || log.date > w.end) continue;
        for (const ex of log.exercises || []) {
          if (!(ex.category in row)) continue; // ignore unknown/legacy categories
          row[ex.category] = (row[ex.category] as number) + exerciseMinutes(ex);
        }
      }
      for (const cat of CATEGORY_KEYS) row[cat] = Math.round(row[cat] as number);
      return row;
    });
  }, [logs]);

  const hasData = chartData.some((row) => CATEGORY_KEYS.some((c) => (row[c] as number) > 0));

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Khối lượng theo tuần (nhóm cơ)</p>
      <p className="text-xs text-text-secondary mb-3">Tổng số phút tập mỗi tuần, chia theo nhóm cơ — {WEEKS_COUNT} tuần gần nhất</p>
      {!hasData ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#8A8A8A' }} interval={0} />
            <YAxis
              tick={{ fontSize: 10, fill: '#8A8A8A' }}
              label={{ value: 'phút', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8A8A8A' }}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {CATEGORY_KEYS.map((cat) => (
              <Bar key={cat} dataKey={cat} stackId="v" name={CATEGORY_LABELS[cat] || cat} fill={CATEGORY_CHART_COLORS[cat] || '#8A8A8A'} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
