import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutLog } from '../../types/workout';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_KEYS, PRESET_MUSCLE_GROUP } from '../../constants/exercises';
import { seriesColor } from '../../constants/chartColors';
import { useChartTheme } from '../../lib/chartTheme';

// Replaces the old radar chart (7 ExerciseCategory axes — an equipment/
// discipline grouping like "Tạ đơn"/"Cardio", not an anatomical one) with a
// horizontal bar chart over real muscle groups (MuscleGroup, see
// types/workout.ts), counted by SETS logged rather than minutes — a user who
// only trains dumbbell work no longer dumps 100% onto one axis; their curls/
// rows/squats now split correctly across Tay/Lưng/Chân.
interface MuscleBalanceChartProps {
  periodLogs: WorkoutLog[];
}

export default function MuscleBalanceChart({ periodLogs }: MuscleBalanceChartProps) {
  const chartTheme = useChartTheme();
  const { chartData, total, weakest } = useMemo(() => {
    const setsByGroup = new Map<string, number>();
    for (const log of periodLogs) {
      for (const ex of log.exercises || []) {
        const group = PRESET_MUSCLE_GROUP[ex.presetId] || 'fullBody';
        setsByGroup.set(group, (setsByGroup.get(group) || 0) + (ex.sets || 1));
      }
    }
    const total = Array.from(setsByGroup.values()).reduce((s, v) => s + v, 0);
    const chartData = MUSCLE_GROUP_KEYS.map((group, i) => {
      const sets = setsByGroup.get(group) || 0;
      return {
        group,
        label: MUSCLE_GROUP_LABELS[group],
        sets,
        pct: total > 0 ? Math.round((sets / total) * 100) : 0,
        color: seriesColor(i),
      };
    }).sort((a, b) => b.sets - a.sets);
    // The bar with the fewest sets, i.e. the muscle group most neglected
    // this period — gives the raw counts a concrete "so what" instead of
    // leaving the reader to eyeball 7 bars for the shortest one.
    const weakest = total > 0 ? chartData.reduce((a, b) => (b.sets < a.sets ? b : a)) : null;
    return { chartData, total, weakest };
  }, [periodLogs]);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Cân bằng nhóm cơ</p>
      <p className="text-xs text-text-secondary mb-3">Số hiệp trong kỳ đang chọn</p>
      {total === 0 ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu trong kỳ này</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: chartTheme.tick }} />
              <YAxis type="category" dataKey="label" width={56} tick={{ fontSize: 11, fill: chartTheme.tickStrong, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${chartTheme.tooltipBorder}`, backgroundColor: chartTheme.tooltipBg, color: chartTheme.tooltipText }}
                formatter={(v: number, _name: string, props: any) => [`${v} hiệp · ${props.payload.pct}%`, 'Số hiệp']}
              />
              <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((row) => (
                  <Cell key={row.group} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {weakest && (
            <p className="text-xs text-text-secondary mt-2">
              🎯 Ít được tập nhất trong kỳ: <span className="font-bold text-text-main">{weakest.label}</span> ({weakest.sets} hiệp
              · {weakest.pct}%)
            </p>
          )}
        </>
      )}
    </div>
  );
}
