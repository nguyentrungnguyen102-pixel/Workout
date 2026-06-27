import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForExercise } from '../services/workoutService';
import { computePRs, getPRLabel, estimate1RM } from '../services/prService';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { WorkoutLog } from '../types/workout';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatExerciseEntry(ex: WorkoutLog['exercises'][0]): string {
  if (ex.unit === 'reps') {
    const sets = ex.sets || 1;
    let v = `${sets}×${ex.reps ?? '-'} reps`;
    if (ex.weight) v += ` · ${ex.weight}kg`;
    return v;
  }
  if (ex.unit === 'seconds') return `${ex.sets || 1}×${ex.durationSeconds ?? '-'}s`;
  if (ex.unit === 'minutes') return `${Math.round((ex.durationSeconds || 0) / 60)} phút`;
  return `${ex.sets || 1} hiệp`;
}

type ChartTab = 'reps' | 'weight' | 'volume' | '1rm';

export default function ExerciseProgressPage() {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>('reps');

  const uid = firebaseUser?.uid;
  const preset = SYSTEM_PRESETS.find((p) => p.id === presetId);
  const isWeightBased = preset?.category === 'dumbbell' || preset?.category === 'strength';

  useEffect(() => {
    if (!uid || !presetId) return;
    setLoading(true);
    getLogsForExercise(uid, presetId)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid, presetId]);

  const prs = computePRs(logs);
  const pr = prs.find((p) => p.presetId === presetId);

  const reversedLogs = [...logs].reverse().slice(-20);

  const repsData = reversedLogs
    .map((log) => {
      const ex = log.exercises.find((e) => e.presetId === presetId);
      if (!ex || ex.unit !== 'reps') return null;
      return { date: formatDateShort(log.date), value: ex.reps || 0, sets: ex.sets || 1 };
    })
    .filter(Boolean) as Array<{ date: string; value: number; sets: number }>;

  const weightData = reversedLogs
    .map((log) => {
      const ex = log.exercises.find((e) => e.presetId === presetId);
      if (!ex || !ex.weight) return null;
      return { date: formatDateShort(log.date), value: ex.weight };
    })
    .filter(Boolean) as Array<{ date: string; value: number }>;

  const volumeData = reversedLogs
    .map((log) => {
      const ex = log.exercises.find((e) => e.presetId === presetId);
      if (!ex || !ex.weight || !ex.reps) return null;
      return {
        date: formatDateShort(log.date),
        value: Math.round(ex.weight * ex.reps * (ex.sets || 1)),
      };
    })
    .filter(Boolean) as Array<{ date: string; value: number }>;

  const oneRMData = reversedLogs
    .map((log) => {
      const ex = log.exercises.find((e) => e.presetId === presetId);
      if (!ex || !ex.weight || !ex.reps) return null;
      return { date: formatDateShort(log.date), value: estimate1RM(ex.reps, ex.weight) };
    })
    .filter(Boolean) as Array<{ date: string; value: number }>;

  const hasWeightData = weightData.length > 0;

  const chartTabs: { key: ChartTab; label: string }[] = [
    { key: 'reps', label: 'Reps' },
    ...(hasWeightData ? [
      { key: 'weight' as ChartTab, label: 'Tạ (kg)' },
      { key: 'volume' as ChartTab, label: 'Volume' },
      { key: '1rm' as ChartTab, label: '1RM' },
    ] : []),
  ];

  const activeChartData = chartTab === 'reps' ? repsData
    : chartTab === 'weight' ? weightData
    : chartTab === 'volume' ? volumeData
    : oneRMData;

  const chartLabel = chartTab === 'reps'
    ? (preset?.unit === 'reps' ? 'Số reps' : 'Thời gian (phút)')
    : chartTab === 'weight' ? 'Trọng lượng (kg)'
    : chartTab === 'volume' ? 'Volume (kg×reps×sets)'
    : '1RM ước tính (kg)';

  const chartUnit = chartTab === 'reps' ? 'reps' : 'kg';

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-card-2 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-black text-text-main">
            {preset?.icon} {preset?.nameVi || presetId}
          </h1>
          <p className="text-xs text-text-secondary">{logs.length} buổi đã ghi nhận</p>
        </div>
      </div>

      {/* PR card */}
      {pr && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-semibold">KỶ LỤC CÁ NHÂN 🏆</p>
            <p className="text-2xl font-black text-primary mt-0.5">{getPRLabel(pr)}</p>
          </div>
          <p className="text-xs text-text-secondary">{pr.achievedDate}</p>
        </div>
      )}

      {/* 1RM card — only for weight-based exercises with data */}
      {isWeightBased && pr?.best1RM && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary font-semibold">1RM ƯỚC TÍNH (EPLEY)</p>
            <p className="text-2xl font-black text-text-main mt-0.5">{pr.best1RM} kg</p>
          </div>
          {pr.bestVolume && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Best Volume</p>
              <p className="text-sm font-black text-text-main">{pr.bestVolume.toLocaleString()} kg</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">{preset?.icon || '💪'}</p>
          <p className="text-text-secondary text-sm">Chưa có dữ liệu cho bài này</p>
        </div>
      ) : (
        <>
          {activeChartData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4">
              {/* Chart tabs */}
              {chartTabs.length > 1 && (
                <div className="flex gap-1 p-1 bg-card-2 rounded-xl mb-3">
                  {chartTabs.map(({ key, label }) => (
                    <button key={key} onClick={() => setChartTab(key)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        chartTab === key ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm font-bold text-text-main mb-3">{chartLabel}</p>

              {chartTab === 'volume' ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={activeChartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                      formatter={(v: number) => [v, 'kg']}
                    />
                    <Bar dataKey="value" fill="#D97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={activeChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                      formatter={(v: number) => [v, chartUnit]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartTab === 'weight' || chartTab === '1rm' ? '#D97706' : '#FF5400'}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartTab === 'weight' || chartTab === '1rm' ? '#D97706' : '#FF5400' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-text-main">Lịch sử</p>
            </div>
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const ex = log.exercises.find((e) => e.presetId === presetId);
                if (!ex) return null;
                const vol = ex.weight && ex.reps ? ex.weight * ex.reps * (ex.sets || 1) : null;
                return (
                  <button key={log.id}
                    onClick={() => navigate(`/history/${log.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-2 transition-colors text-left">
                    <span className="text-sm text-text-secondary">{formatDateVi(log.date)}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-text-main">{formatExerciseEntry(ex)}</span>
                      {vol !== null && (
                        <p className="text-xs text-text-muted">Vol: {vol.toLocaleString()} kg</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
