import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForExercise } from '../services/workoutService';
import { computePRs, getPRLabel } from '../services/prService';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { WorkoutLog } from '../types/workout';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
    let v = `${ex.sets}×${ex.reps ?? '-'} reps`;
    if (ex.weight) v += ` · ${ex.weight}kg`;
    return v;
  }
  if (ex.unit === 'seconds') return `${ex.sets}×${ex.durationSeconds ?? '-'}s`;
  if (ex.unit === 'minutes') return `${Math.round((ex.durationSeconds || 0) / 60)} phút`;
  return `${ex.sets} hiệp`;
}

export default function ExerciseProgressPage() {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = firebaseUser?.uid;
  const preset = SYSTEM_PRESETS.find((p) => p.id === presetId);

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

  const chartData = [...logs]
    .reverse()
    .slice(-20)
    .map((log) => {
      const ex = log.exercises.find((e) => e.presetId === presetId);
      if (!ex) return null;
      return {
        date: formatDateShort(log.date),
        value: ex.unit === 'reps' ? (ex.reps || 0) : Math.round((ex.durationSeconds || 0) / 60),
        sets: ex.sets,
        weight: ex.weight,
      };
    })
    .filter(Boolean) as Array<{ date: string; value: number; sets: number; weight?: number }>;

  const hasWeightData = chartData.some((d) => d.weight !== undefined);

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

      {pr && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-semibold">KỶ LỤC CÁ NHÂN 🏆</p>
            <p className="text-2xl font-black text-primary mt-0.5">{getPRLabel(pr)}</p>
          </div>
          <p className="text-xs text-text-secondary">{pr.achievedDate}</p>
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
          {chartData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4">
              <p className="text-sm font-bold text-text-main mb-3">
                {preset?.unit === 'reps' ? 'Số reps' : 'Thời gian (phút)'}
                {hasWeightData ? ' · Tạ (kg)' : ''}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} />
                  {hasWeightData && (
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} />
                  )}
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                    formatter={(v: number, name: string) => [v, name]}
                  />
                  {hasWeightData && <Legend wrapperStyle={{ fontSize: 11 }} />}
                  <Line yAxisId="left" type="monotone" dataKey="value" name={preset?.unit === 'reps' ? 'reps' : 'phút'} stroke="#FF5400" strokeWidth={2.5} dot={{ r: 3, fill: '#FF5400' }} />
                  {hasWeightData && (
                    <Line yAxisId="right" type="monotone" dataKey="weight" name="kg" stroke="#B45309" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: '#B45309' }} connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
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
                return (
                  <button key={log.id}
                    onClick={() => navigate(`/history/${log.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-2 transition-colors text-left">
                    <span className="text-sm text-text-secondary">{formatDateVi(log.date)}</span>
                    <span className="text-sm font-semibold text-text-main">{formatExerciseEntry(ex)}</span>
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
