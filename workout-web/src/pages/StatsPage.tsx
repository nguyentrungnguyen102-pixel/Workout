import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { getRecentLogs } from '../services/workoutService';
import { computePRs, getPRLabel } from '../services/prService';
import { WorkoutLog } from '../types/workout';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPeriodRange(p: 'day' | 'week' | 'month'): { start: string; end: string } {
  const now = new Date();
  const today = toDateStr(now);
  if (p === 'day') return { start: today, end: today };
  if (p === 'week') {
    const dow = (now.getDay() + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow);
    return { start: toDateStr(mon), end: today };
  }
  return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: today };
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh', core: 'Bụng & Core', cardio: 'Cardio', mobility: 'Linh hoạt', recovery: 'Phục hồi', dumbbell: 'Tạ đơn',
};
const CATEGORY_COLORS_STATS: Record<string, string> = {
  strength: '#FF5400', core: '#BE185D', cardio: '#2563EB', mobility: '#059669', recovery: '#7C3AED', dumbbell: '#D97706',
};

function get7DayData(logs: WorkoutLog[]): Array<{ day: string; count: number }> {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const count = logs.filter((l) => l.date === dateStr).length;
    return { day: DAY_LABELS[d.getDay()], count };
  });
}

function getTopExercise(logs: WorkoutLog[]): string | null {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const ex of log.exercises) {
      map.set(ex.name, (map.get(ex.name) || 0) + 1);
    }
  }
  if (map.size === 0) return null;
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

interface VolumeEntry {
  name: string;
  thisWeek: number;
  lastWeek: number;
  delta: number;
}

// Tonnage (sets × reps × weight, in kg) — matches workout-tracker's mobile
// Progressive Overload volume card. Only counts exercises with a recorded
// weight (dumbbell/strength); bodyweight reps have no tonnage to compare.
function getVolumeProgress(logs: WorkoutLog[]): VolumeEntry[] {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekAgoStr = toStr(weekAgo);
  const twoWeeksAgoStr = toStr(twoWeeksAgo);
  const todayStr = toStr(now);

  const thisWeekLogs = logs.filter((l) => l.date > weekAgoStr && l.date <= todayStr);
  const lastWeekLogs = logs.filter((l) => l.date > twoWeeksAgoStr && l.date <= weekAgoStr);

  const volumes = new Map<string, { thisWeek: number; lastWeek: number }>();
  const accumulate = (targetLogs: WorkoutLog[], key: 'thisWeek' | 'lastWeek') => {
    for (const log of targetLogs) {
      for (const ex of log.exercises) {
        if (!ex.weight || !ex.reps) continue;
        const vol = ex.sets * ex.reps * ex.weight;
        const entry = volumes.get(ex.name) || { thisWeek: 0, lastWeek: 0 };
        entry[key] += vol;
        volumes.set(ex.name, entry);
      }
    }
  };
  accumulate(thisWeekLogs, 'thisWeek');
  accumulate(lastWeekLogs, 'lastWeek');

  return Array.from(volumes.entries())
    .map(([name, v]) => ({
      name,
      thisWeek: Math.round(v.thisWeek),
      lastWeek: Math.round(v.lastWeek),
      delta: v.lastWeek > 0 ? Math.round(((v.thisWeek - v.lastWeek) / v.lastWeek) * 100) : 0,
    }))
    .filter((e) => e.thisWeek > 0 || e.lastWeek > 0)
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .slice(0, 5);
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getRecentLogs(uid, 100)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  const streak = profile?.streak?.current || 0;
  const weeklyGoal = profile?.weeklyGoalMinutes || 150;
  const weeklyDone = profile?.weeklyStats?.totalMinutes || 0;
  const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyGoal) * 100));

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLogs = logs.filter((l) => l.date >= monthStart);
  const totalKcal = logs.reduce((s, l) => s + (l.caloriesEstimate || 0), 0);
  const totalTime = logs.reduce((s, l) => s + (l.totalDurationMinutes || 0), 0);

  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const last30Str = `${last30Start.getFullYear()}-${String(last30Start.getMonth() + 1).padStart(2, '0')}-${String(last30Start.getDate()).padStart(2, '0')}`;
  const last30Logs = logs.filter((l) => l.date >= last30Str);
  const uniqueDays30 = new Set(last30Logs.map((l) => l.date)).size;
  const consistencyScore = Math.min(100, Math.round((uniqueDays30 / 30) * 100));

  const sevenDayData = get7DayData(logs);
  const topExercise = getTopExercise(logs);
  const prs = computePRs(logs).slice(0, 6);
  const volumeProgress = getVolumeProgress(logs);

  const { start: periodStart, end: periodEnd } = getPeriodRange(period);
  const periodLogs = logs.filter(l => l.date >= periodStart && l.date <= periodEnd);
  const periodMinutes = periodLogs.reduce((s, l) => s + l.totalDurationMinutes, 0);
  const periodKcal = periodLogs.reduce((s, l) => s + l.caloriesEstimate, 0);
  const periodSessions = periodLogs.length;

  const categoryStats = new Map<string, { minutes: number; count: number }>();
  for (const log of periodLogs) {
    for (const ex of log.exercises) {
      const mins = (ex.unit === 'minutes' || ex.unit === 'seconds') ? (ex.durationSeconds || 0) / 60 : 3;
      const e = categoryStats.get(ex.category) || { minutes: 0, count: 0 };
      categoryStats.set(ex.category, { minutes: e.minutes + mins, count: e.count + 1 });
    }
  }
  const maxCatMinutes = Math.max(...Array.from(categoryStats.values()).map(v => v.minutes), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-8">
      <h1 className="text-2xl font-black text-text-main mb-4">Thống kê</h1>

      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-card-2 rounded-xl mb-4">
        {(['day', 'week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === p ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}>
            {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
          </button>
        ))}
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-primary">{periodSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">buổi tập</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-text-main">{periodMinutes}</p>
          <p className="text-xs text-text-secondary mt-0.5">phút</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xl font-black text-text-main">{periodKcal.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">kcal</p>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryStats.size > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-sm font-bold text-text-main mb-3">Theo loại bài tập</p>
          <div className="space-y-2.5">
            {Array.from(categoryStats.entries())
              .sort((a, b) => b[1].minutes - a[1].minutes)
              .map(([cat, { minutes, count }]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold" style={{ color: CATEGORY_COLORS_STATS[cat] || '#8A8A8A' }}>
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                  <span className="text-text-muted">{Math.round(minutes)} phút · {count} bài</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(minutes / maxCatMinutes) * 100}%`, backgroundColor: CATEGORY_COLORS_STATS[cat] || '#8A8A8A' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-primary rounded-2xl p-5 mb-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={24} className="text-white" />
          <div>
            <p className="text-4xl font-black">{streak}</p>
            <p className="text-sm opacity-80">ngày liên tiếp</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-xl font-black">{monthLogs.length}</p>
            <p className="text-xs opacity-80">buổi tháng này</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-xl font-black">{totalKcal.toLocaleString()}</p>
            <p className="text-xs opacity-80">kcal tổng</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-text-main">Mục tiêu tuần</span>
          <span className="text-sm font-bold text-primary">{weeklyDone}/{weeklyGoal} phút</span>
        </div>
        <div className="h-2.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${weeklyPct}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">{weeklyPct}% hoàn thành</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-sm font-bold text-text-main mb-3">7 ngày gần nhất</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={sevenDayData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A8A8A' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8A8A' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E7E2' }}
              formatter={(v: number) => [v, 'buổi']}
            />
            <Bar dataKey="count" fill="#FF5400" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-black text-primary">{totalTime}</p>
          <p className="text-xs text-text-secondary mt-1">tổng phút tập</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-black text-text-main">{totalKcal.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">tổng kcal</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-black text-text-main">{logs.length}</p>
          <p className="text-xs text-text-secondary mt-1">tổng buổi tập</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-2xl font-black text-text-main">{profile?.streak?.longest || 0}</p>
          <p className="text-xs text-text-secondary mt-1">chuỗi dài nhất</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-text-main">Điểm kiên trì (30 ngày)</p>
          <p className="text-sm font-black text-primary">{consistencyScore}/100</p>
        </div>
        <div className="h-2.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${consistencyScore}%`, backgroundColor: consistencyScore >= 70 ? '#1DAA60' : consistencyScore >= 40 ? '#D97706' : '#FF5400' }} />
        </div>
        <p className="text-xs text-text-secondary mt-1">{uniqueDays30} ngày tập trong 30 ngày qua</p>
      </div>

      {topExercise && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Trophy size={20} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">Bài tập yêu thích</p>
            <p className="font-bold text-text-main text-sm">{topExercise}</p>
          </div>
        </div>
      )}

      {prs.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-sm font-bold text-text-main mb-3">Kỷ lục cá nhân 🏆</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {prs.map((pr) => (
              <button key={pr.presetId}
                onClick={() => navigate(`/stats/exercise/${pr.presetId}`)}
                className="bg-card-2 rounded-xl p-3 text-left hover:bg-primary-light transition-colors">
                <p className="text-xs text-text-secondary mb-0.5 truncate">{pr.name}</p>
                <p className="font-black text-text-main text-sm">{getPRLabel(pr)}</p>
                <p className="text-xs text-text-secondary mt-0.5">{pr.achievedDate}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {volumeProgress.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-sm font-bold text-text-main mb-3">Khối lượng tạ tuần này vs tuần trước (kg)</p>
          <div className="space-y-3">
            {volumeProgress.map((v) => {
              const max = Math.max(v.thisWeek, v.lastWeek, 1);
              const neutral = v.delta === 0 || v.lastWeek === 0;
              const positive = v.delta > 0;
              return (
                <div key={v.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate max-w-[120px] text-text-secondary">{v.name}</span>
                    {!neutral && (
                      <span className={`font-bold ${positive ? 'text-success' : 'text-danger'}`}>
                        {positive ? '▲' : '▼'} {Math.abs(v.delta)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-text-muted w-16 flex-shrink-0">Tuần này</span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(v.thisWeek / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-secondary w-14 text-right flex-shrink-0">{v.thisWeek} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-16 flex-shrink-0">Tuần trước</span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-border rounded-full transition-all" style={{ width: `${(v.lastWeek / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-secondary w-14 text-right flex-shrink-0">{v.lastWeek} kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/programs')}
        className="w-full py-4 border border-border rounded-2xl text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
        Xem chương trình tập →
      </button>
    </div>
  );
}
