import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutLog } from '../../types/workout';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_KEYS, PRESET_MUSCLE_GROUP } from '../../constants/exercises';
import { seriesColor } from '../../constants/chartColors';

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
  const { chartData, total } = useMemo(() => {
    const setsByGroup = new Map<string, number>();
    for (const log of periodLogs) {
      for (const ex of log.exercises || []) {
        const group = PRESET_MUSCLE_GROUP[ex.presetId] || 'fullBody';
        setsByGroup.set(group, (setsByGroup.get(group) || 0) + (ex.sets || 1));
      }
    }
    const total = Array.from(setsByGroup.values()).reduce((s, v) => s + v, 0);
    const chartData = MUSCLE_GROUP_KEYS.map((group, i) => ({
      group,
      label: MUSCLE_GROUP_LABELS[group],
      sets: setsByGroup.get(group) || 0,
      color: seriesColor(i),
    })).sort((a, b) => b.sets - a.sets);
    return { chartData, total };
  }, [periodLogs]);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Cân bằng nhóm cơ</p>
      <p className="text-xs text-text-secondary mb-3">Số hiệp theo nhóm cơ trong kỳ — nhóm nào đang bị bỏ quên?</p>
      {total === 0 ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu trong kỳ này</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#8A8A8A' }} />
            <YAxis type="category" dataKey="label" width={56} tick={{ fontSize: 11, fill: '#111111', fontWeight: 700 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
              formatter={(v: number) => [`${v} hiệp`, 'Số hiệp']}
            />
            <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((row) => (
                <Cell key={row.group} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
