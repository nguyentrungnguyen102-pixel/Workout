import { useMemo, useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { WorkoutLog } from '../../types/workout';
import { exerciseMinutes } from '../../lib/energy';
import { seriesColor } from '../../constants/chartColors';

// Cap on overlaid lines so the chart doesn't turn into spaghetti (dataviz
// guidance: avoid more than ~6 overlaid series).
const MAX_EXERCISES = 6;

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface DailyExerciseChartProps {
  periodLogs: WorkoutLog[];
}

interface SeriesMeta {
  presetId: string;
  name: string;
  color: string;
}

export default function DailyExerciseChart({ periodLogs }: DailyExerciseChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const { chartData, series, truncated } = useMemo(() => {
    interface DayBucket { totalMinutes: number; reps: Map<string, number> }
    interface Meta { name: string; category: string; totalReps: number }

    const dayMap = new Map<string, DayBucket>();
    const metaMap = new Map<string, Meta>();

    for (const log of periodLogs) {
      if (!log.date) continue;
      const bucket = dayMap.get(log.date) || { totalMinutes: 0, reps: new Map<string, number>() };
      for (const ex of log.exercises || []) {
        if (!ex.presetId) continue;
        const mins = exerciseMinutes(ex);
        const reps = ex.reps ?? 0;
        bucket.totalMinutes += mins;
        bucket.reps.set(ex.presetId, (bucket.reps.get(ex.presetId) || 0) + reps);

        const meta = metaMap.get(ex.presetId) || { name: ex.name, category: ex.category, totalReps: 0 };
        meta.totalReps += reps;
        metaMap.set(ex.presetId, meta);
      }
      dayMap.set(log.date, bucket);
    }

    const ranked = Array.from(metaMap.entries()).sort((a, b) => b[1].totalReps - a[1].totalReps);
    const topPresets = ranked.slice(0, MAX_EXERCISES);
    const truncated = ranked.length > MAX_EXERCISES;

    // Each exercise gets its own distinct high-contrast color (not grouped
    // by category) — with only ≤6 lines on screen, per-exercise color reads
    // far more clearly than same-category lines sharing a hue + dash pattern.
    const series: SeriesMeta[] = topPresets.map(([presetId, meta], idx) => ({
      presetId,
      name: meta.name,
      color: seriesColor(idx),
    }));

    const chartData = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, bucket]) => {
        const row: Record<string, string | number | null> = {
          date: formatDateShort(date),
          totalMinutes: Math.round(bucket.totalMinutes),
        };
        for (const [presetId] of topPresets) {
          row[presetId] = bucket.reps.has(presetId) ? bucket.reps.get(presetId)! : null;
        }
        return row;
      });

    return { chartData, series, truncated };
  }, [periodLogs]);

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Bài tập theo ngày</p>
      <p className="text-xs text-text-secondary mb-3">
        Trục trái: số lượng (cái) mỗi bài · Trục phải: tổng số phút tập/ngày
        {truncated ? ' · hiện 6 bài nhiều nhất' : ''}
      </p>
      {chartData.length === 0 || series.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu trong kỳ này</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#8A8A8A' }}
              label={{ value: 'cái', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8A8A8A' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#8A8A8A' }}
              label={{ value: 'phút', angle: 90, position: 'insideRight', fontSize: 10, fill: '#8A8A8A' }}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} onClick={(e) => e?.dataKey && toggle(String(e.dataKey))} />
            <Bar
              yAxisId="right"
              dataKey="totalMinutes"
              name="Tổng số phút"
              fill="#DEDCD5"
              radius={[4, 4, 0, 0]}
              barSize={14}
              hide={hidden.has('totalMinutes')}
            />
            {series.map((s) => (
              <Line
                key={s.presetId}
                yAxisId="left"
                type="monotone"
                dataKey={s.presetId}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.2}
                dot={{ r: 2.5 }}
                connectNulls
                hide={hidden.has(s.presetId)}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
