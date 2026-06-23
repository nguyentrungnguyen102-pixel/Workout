import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForExercise } from '../services/workoutService';
import { computePRs, getPRLabel } from '../services/prService';
import { SYSTEM_PRESETS } from '../constants/exercises';
import { WorkoutLog } from '../types/workout';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

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
    const setsLabel = ex.sets > 1 ? `${ex.sets}×` : '';
    let v = `${setsLabel}${ex.reps ?? '-'} cái`;
    if (ex.weight) v += ` · ${ex.weight}kg`;
    return v;
  }
  if (ex.unit === 'seconds') {
    const s = ex.durationSeconds ?? 0;
    return s >= 60 ? `${Math.round(s / 60)} phút` : `${s}s`;
  }
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

  const weightChartData = chartData.filter((d) => d.weight && d.weight > 0);

  // Brzycki 1RM estimate: only valid for ≤30 reps
  const latestWithWeight = [...logs].reverse().find((l) => {
    const ex = l.exercises.find((e) => e.presetId === presetId);
    return ex?.weight && ex.weight > 0 && ex.unit === 'reps' && (ex.reps || 0) <= 30;
  });
  const oneRM = (() => {
    if (!latestWithWeight) return null;
    const ex = latestWithWeight.exercises.find((e) => e.presetId === presetId);
    if (!ex?.weight || !ex.reps || ex.reps > 30) return null;
    return Math.round(ex.weight * (36 / (37 - ex.reps)));
  })();

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
          {/* 1RM card */}
          {oneRM && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary font-semibold">ƯỚC LƯỢNG 1RM</p>
                <p className="text-2xl font-black text-text-main mt-0.5">{oneRM} kg</p>
              </div>
              <p className="text-xs text-text-muted text-right leading-relaxed">Công thức Brzycki<br/>từ buổi gần nhất</p>
            </div>
          )}

          {/* Reps/duration chart */}
          {chartData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4">
              <p className="text-sm font-bold text-text-main mb-3">
                {preset?.unit === 'reps' ? 'Số reps theo buổi' : 'Thời gian (phút)'}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                    formatter={(v: number) => [v, preset?.unit === 'reps' ? 'reps' : 'phút']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#FF5400" strokeWidth={2.5} dot={{ r: 3, fill: '#FF5400' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weight progression chart */}
          {weightChartData.length > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4">
              <p className="text-sm font-bold text-text-main mb-1">Tiến bộ tạ (kg)</p>
              <p className="text-xs text-text-secondary mb-3">Tăng tải theo thời gian</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={weightChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E2" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8A8A' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#8A8A8A' }} domain={['auto', 'auto']} unit="kg" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
                    formatter={(v: number) => [`${v} kg`, 'Tạ']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3, fill: '#D97706' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {weightChartData.length === 1 && (
            <div className="bg-card rounded-2xl border border-border p-3 mb-4 flex items-center gap-3">
              <span className="text-xl">🏋️</span>
              <div>
                <p className="text-sm font-semibold text-text-main">Tạ lần đầu: {weightChartData[0].weight} kg</p>
                <p className="text-xs text-text-secondary">Tập thêm để xem biểu đồ tiến bộ</p>
              </div>
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
