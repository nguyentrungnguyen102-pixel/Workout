import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutLog } from '../../types/workout';
import { exerciseMinutes } from '../../lib/energy';
import { CATEGORY_LABELS } from '../../constants/exercises';
import { CATEGORY_CHART_COLORS } from '../../constants/chartColors';

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);
// label -> category key, so the axis-tick renderer (which only receives the
// Vietnamese label text from chartData) can look up the matching chart color.
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  CATEGORY_KEYS.map((k) => [CATEGORY_LABELS[k], k])
);

// Custom axis-tick renderer: colors each muscle-group label by
// CATEGORY_CHART_COLORS (same map WeeklyVolumeChart uses) so the two
// aggregate charts share one color language and each axis reads distinctly
// instead of every label sitting in the same muted gray.
function CategoryTick({ x, y, payload, textAnchor }: any) {
  const key = LABEL_TO_KEY[payload.value];
  const color = CATEGORY_CHART_COLORS[key] || '#8A8A8A';
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={10} fontWeight={700} fill={color}>
      {payload.value}
    </text>
  );
}

// Custom vertex-dot renderer: same per-category color as the tick, so each
// point on the radar visually ties back to its axis label.
function CategoryDot({ cx, cy, index }: any) {
  const key = CATEGORY_KEYS[index];
  const color = CATEGORY_CHART_COLORS[key] || '#8A8A8A';
  return <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />;
}

interface MuscleRadarChartProps {
  periodLogs: WorkoutLog[];
}

export default function MuscleRadarChart({ periodLogs }: MuscleRadarChartProps) {
  const { chartData, total } = useMemo(() => {
    const minutesByCat = new Map<string, number>();
    for (const log of periodLogs) {
      for (const ex of log.exercises || []) {
        minutesByCat.set(ex.category, (minutesByCat.get(ex.category) || 0) + exerciseMinutes(ex));
      }
    }
    const total = Array.from(minutesByCat.values()).reduce((s, v) => s + v, 0);
    const chartData = CATEGORY_KEYS.map((cat) => ({
      category: CATEGORY_LABELS[cat],
      pct: total > 0 ? Math.round(((minutesByCat.get(cat) || 0) / total) * 100) : 0,
    }));
    return { chartData, total };
  }, [periodLogs]);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Cân bằng nhóm cơ</p>
      <p className="text-xs text-text-secondary mb-3">% số phút tập theo nhóm cơ trong kỳ — nhóm nào đang bị bỏ quên?</p>
      {total === 0 ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu trong kỳ này</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chartData} outerRadius="75%">
            <PolarGrid stroke="#E8E7E2" />
            <PolarAngleAxis dataKey="category" tick={<CategoryTick />} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: '#8A8A8A' }} angle={90} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
              formatter={(v: number) => [`${v}%`, 'Tỉ lệ']}
            />
            <Radar name="Tỉ lệ" dataKey="pct" stroke="#FF5400" fill="#FF5400" fillOpacity={0.25} dot={<CategoryDot />} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
