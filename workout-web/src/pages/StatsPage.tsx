import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getRecentLogs, getLogsForHeatmap } from '../services/workoutService';
import { computePRs, getPRLabel } from '../services/prService';
import { WorkoutLog } from '../types/workout';
import { getWeekLabel, formatTimeOfDay, formatDayOfWeekVi, formatDateVi, daysBetween } from '../lib/date';
import { exerciseMinutes } from '../lib/energy';
import { SYSTEM_PRESETS, CATEGORY_COLORS_STATS } from '../constants/exercises';
import MonthCalendar from '../components/MonthCalendar';
import ActivityHeatmap from '../components/ActivityHeatmap';
import WeeklyPlanCard from '../components/WeeklyPlanCard';
import ExercisePeriodTable from '../components/ExercisePeriodTable';
import CoachInsights from '../components/CoachInsights';
import DailyExerciseChart from '../components/charts/DailyExerciseChart';
import WeeklyVolumeChart from '../components/charts/WeeklyVolumeChart';
import MuscleRadarChart from '../components/charts/MuscleRadarChart';
import AchievementsCard from '../components/AchievementsCard';

type Period = 'week' | 'month' | 'quarter';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday (local) of the week containing `d`. Re-implemented here (not
// imported from lib/weeklyPlan.ts, which is being edited concurrently by
// someone else) using the same (getDay()+6)%7 convention used across the
// codebase (dayTimeline.ts's weekStartStr, weeklyPlan.ts's mondayOf).
function mondayOfLocal(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // 0=Mon..6=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - dow);
  return mon;
}

function lastDayOfMonth(year: number, month0: number): Date {
  return new Date(year, month0 + 1, 0);
}

// getPeriodRange: `offset` shifts the period backward (negative) or forward
// (positive, capped at 0 by the UI) relative to the current period.
// offset 0 always means "period-to-date" (ends today); non-zero offsets are
// whole/closed periods (end = last day of that period).
function getPeriodRange(p: Period, offset: number): { start: string; end: string } {
  const now = new Date();
  const today = toDateStr(now);

  if (p === 'week') {
    const curMonday = mondayOfLocal(now);
    const mon = new Date(curMonday);
    mon.setDate(curMonday.getDate() + offset * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: toDateStr(mon), end: offset === 0 ? today : toDateStr(sun) };
  }

  if (p === 'month') {
    const ymIndex = now.getFullYear() * 12 + now.getMonth() + offset;
    const year = Math.floor(ymIndex / 12);
    const month0 = ymIndex % 12;
    const start = `${year}-${String(month0 + 1).padStart(2, '0')}-01`;
    if (offset === 0) return { start, end: today };
    return { start, end: toDateStr(lastDayOfMonth(year, month0)) };
  }

  // quarter (3 months): window = 3 calendar months ending at the anchor
  // month (currentMonth + offset*3), e.g. offset 0 today=Jul -> May..Jul.
  const anchorYmIndex = now.getFullYear() * 12 + now.getMonth() + offset * 3;
  const startYmIndex = anchorYmIndex - 2;
  const startYear = Math.floor(startYmIndex / 12);
  const startMonth0 = startYmIndex % 12;
  const start = `${startYear}-${String(startMonth0 + 1).padStart(2, '0')}-01`;
  if (offset === 0) return { start, end: today };
  const endYear = Math.floor(anchorYmIndex / 12);
  const endMonth0 = anchorYmIndex % 12;
  return { start, end: toDateStr(lastDayOfMonth(endYear, endMonth0)) };
}

const MONTH_ABBR_VI = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

function getPeriodLabel(p: Period, offset: number): string {
  const now = new Date();

  if (p === 'week') {
    const curMonday = mondayOfLocal(now);
    const mon = new Date(curMonday);
    mon.setDate(curMonday.getDate() + offset * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const dd = (d: Date) => String(d.getDate()).padStart(2, '0');
    const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, '0');
    if (mon.getMonth() === sun.getMonth()) return `${dd(mon)}–${dd(sun)}/${mm(sun)}`;
    return `${dd(mon)}/${mm(mon)}–${dd(sun)}/${mm(sun)}`;
  }

  if (p === 'month') {
    const ymIndex = now.getFullYear() * 12 + now.getMonth() + offset;
    const year = Math.floor(ymIndex / 12);
    const month0 = ymIndex % 12;
    return `Tháng ${month0 + 1}/${year}`;
  }

  // quarter
  const anchorYmIndex = now.getFullYear() * 12 + now.getMonth() + offset * 3;
  const startYmIndex = anchorYmIndex - 2;
  const startMonth0 = startYmIndex % 12;
  const endYear = Math.floor(anchorYmIndex / 12);
  const endMonth0 = anchorYmIndex % 12;
  return `${MONTH_ABBR_VI[startMonth0]}–${MONTH_ABBR_VI[endMonth0]}/${endYear}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Sức mạnh', core: 'Bụng & Core', cardio: 'Cardio', mobility: 'Linh hoạt', recovery: 'Phục hồi', dumbbell: 'Tạ đơn',
};

function getTopExercise(logs: WorkoutLog[]): string | null {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const ex of log.exercises || []) {
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
      for (const ex of log.exercises || []) {
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

function groupByWeek(logs: WorkoutLog[]): Array<{ label: string; logs: WorkoutLog[] }> {
  const map = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    if (!log.date) continue; // defensive: can't place an undated log in a week bucket
    const label = getWeekLabel(log.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(log);
  }
  return Array.from(map.entries()).map(([label, logs]) => ({ label, logs }));
}

// Short "d/m" date, no year — keeps the datasheet row on one line (same
// trimmed format DailyExerciseChart uses for its X axis). formatDateVi's
// dd/mm/yyyy is too wide for a compact single-line log row.
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// First ~2 exercise names + "…" when there are more — e.g. "4 bài: Hít đất, Plank…"
function summarizeExercises(log: WorkoutLog): string {
  const exs = log.exercises || [];
  if (exs.length === 0) return 'Chưa có bài tập';
  const names = exs.slice(0, 2).map((e) => e.name).join(', ');
  return `${exs.length} bài: ${names}${exs.length > 2 ? '…' : ''}`;
}

interface LogRowProps {
  log: WorkoutLog;
  onClick: () => void;
}

// Compact datasheet-style row (v2.14.0) — replaces the old multi-line
// SessionCard so the history list scans like a table: one row per log.
function LogRow({ log, onClick }: LogRowProps) {
  const timeStr = formatTimeOfDay(log.startedAt ?? log.createdAt);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 py-2 px-1 border-b border-border text-sm text-left hover:bg-card-2 active:scale-[0.99] transition-all"
    >
      <span className="flex-shrink-0 text-xs font-bold text-text-secondary whitespace-nowrap">
        {log.date ? `${formatDayOfWeekVi(log.date)} ${formatDateShort(log.date)}` : '—'}
        {timeStr ? ` · ${timeStr}` : ''}
      </span>
      <span className="flex-1 min-w-0 truncate text-text-main">{summarizeExercises(log)}</span>
      <span className="flex-shrink-0 text-xs text-text-secondary whitespace-nowrap">
        {log.totalDurationMinutes ?? 0}′ · {log.caloriesEstimate ?? 0} kcal
      </span>
    </button>
  );
}

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return <h2 className="text-base font-black text-text-main mt-6 mb-2 px-1">{title}</h2>;
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { profile, firebaseUser } = useUserStore();
  const [heatmapLogs, setHeatmapLogs] = useState<WorkoutLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [chartsOpen, setChartsOpen] = useState(true);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    // allSettled: one failed query must not blank the whole page
    Promise.allSettled([
      getLogsForHeatmap(uid, '2000-01-01'),
      getRecentLogs(uid, 50),
    ]).then(([hm, recent]) => {
      if (hm.status === 'fulfilled') setHeatmapLogs(hm.value);
      if (recent.status === 'fulfilled') setRecentLogs(recent.value);
    }).finally(() => setLoading(false));
  }, [uid]);

  // heatmapLogs is the full-history source (like HistoryPage used it) — it
  // drives everything that needs "all logs", while recentLogs (last 50)
  // drives the week-grouped session list below.
  const logs = heatmapLogs;

  const streak = profile?.streak?.current || 0;
  const weeklyGoal = profile?.weeklyGoalMinutes || 150;
  const weeklyDone = profile?.weeklyStats?.totalMinutes || 0;
  const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyGoal) * 100));

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLogs = logs.filter((l) => (l.date || '') >= monthStart);
  const totalKcal = logs.reduce((s, l) => s + (l.caloriesEstimate || 0), 0);
  const totalTime = logs.reduce((s, l) => s + (l.totalDurationMinutes || 0), 0);

  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const last30Str = `${last30Start.getFullYear()}-${String(last30Start.getMonth() + 1).padStart(2, '0')}-${String(last30Start.getDate()).padStart(2, '0')}`;
  const last30Logs = logs.filter((l) => (l.date || '') >= last30Str);
  const uniqueDays30 = new Set(last30Logs.map((l) => l.date).filter(Boolean)).size;
  const consistencyScore = Math.min(100, Math.round((uniqueDays30 / 30) * 100));

  const topExercise = getTopExercise(logs);
  const prs = computePRs(logs).slice(0, 6);
  const volumeProgress = getVolumeProgress(logs);

  const { start: periodStart, end: periodEnd } = getPeriodRange(period, periodOffset);
  const periodLogs = logs.filter(l => (l.date || '') >= periodStart && (l.date || '') <= periodEnd);
  const { start: prevPeriodStart, end: prevPeriodEnd } = getPeriodRange(period, periodOffset - 1);
  const prevPeriodLogs = logs.filter(l => (l.date || '') >= prevPeriodStart && (l.date || '') <= prevPeriodEnd);
  const periodLabel = getPeriodLabel(period, periodOffset);
  // Elapsed days in the period being viewed, and the previous period's day
  // count to compare it against. Only the current (offset 0) period is
  // "to date" (partial); anything else is already a closed/full period, so
  // there prevPeriodDays is pinned to periodDays — a no-op proration ratio,
  // since a day-count mismatch between two closed periods (31-day Jan vs
  // 28-day Feb) is calendar noise, not a real pace signal.
  const periodDays = daysBetween(periodStart, periodEnd) + 1;
  const prevPeriodDays = periodOffset === 0 ? daysBetween(prevPeriodStart, prevPeriodEnd) + 1 : periodDays;
  const periodMinutes = periodLogs.reduce((s, l) => s + (l.totalDurationMinutes || 0), 0);
  const periodKcal = periodLogs.reduce((s, l) => s + (l.caloriesEstimate || 0), 0);
  const periodSessions = periodLogs.length;

  const categoryStats = new Map<string, { minutes: number; count: number }>();
  for (const log of periodLogs) {
    for (const ex of log.exercises || []) {
      const mins = exerciseMinutes(ex);
      const e = categoryStats.get(ex.category) || { minutes: 0, count: 0 };
      categoryStats.set(ex.category, { minutes: e.minutes + mins, count: e.count + 1 });
    }
  }
  const maxCatMinutes = Math.max(...Array.from(categoryStats.values()).map(v => v.minutes), 1);

  const weekGroups = groupByWeek(recentLogs);

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

      {/* ═══════════════════════ Tổng quan ═══════════════════════ */}
      <SectionHeader title="Tổng quan" />

      {/* Period selector — drives KPI strip, ActivityHeatmap (hour view) and category breakdown */}
      <div className="flex gap-1 p-1 bg-card-2 rounded-xl mb-3">
        {(['week', 'month', 'quarter'] as const).map(p => (
          <button key={p} onClick={() => { setPeriod(p); setPeriodOffset(0); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === p ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}>
            {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : '3 tháng'}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setPeriodOffset(o => o - 1)}
          aria-label="Kỳ trước"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-card-2 text-text-secondary hover:text-primary active:scale-95 transition-all flex-shrink-0">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-text-main">{periodLabel}</span>
          {periodOffset !== 0 && (
            <button onClick={() => setPeriodOffset(0)}
              className="text-xs font-bold text-primary underline underline-offset-2">
              Hôm nay
            </button>
          )}
        </div>
        <button onClick={() => setPeriodOffset(o => Math.min(0, o + 1))}
          disabled={periodOffset === 0}
          aria-label="Kỳ sau"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-card-2 text-text-secondary hover:text-primary active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex-shrink-0">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* KPI strip */}
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

      {/* Streak card */}
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

      {/* Weekly goal */}
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

      {/* Totals grid */}
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

      {/* Consistency */}
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

      {/* Fitness assessment (coach insights) */}
      <CoachInsights allLogs={logs} periodLogs={periodLogs} prevPeriodLogs={prevPeriodLogs} profile={profile} periodLabel={periodLabel} periodDays={periodDays} prevPeriodDays={prevPeriodDays} periodStart={periodStart} periodEnd={periodEnd} />

      {/* Weekly plan card */}
      <WeeklyPlanCard logs={logs} profile={profile} />

      {/* ═══════════════════════ Biểu đồ ═══════════════════════ */}
      <SectionHeader title="Biểu đồ" />

      <div className="mb-1">
        <button onClick={() => setChartsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-1 py-2 mb-1">
          <span className="text-sm font-black text-text-main">📈 Xu hướng & phân bổ</span>
          {chartsOpen ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
        </button>
        {chartsOpen && (
          <>
            <DailyExerciseChart periodLogs={periodLogs} />
            <WeeklyVolumeChart logs={logs} />
            <MuscleRadarChart periodLogs={periodLogs} />
          </>
        )}
      </div>

      {/* Merged heatmap card (Theo ngày / Theo khung giờ toggle) */}
      <ActivityHeatmap allLogs={heatmapLogs} periodLogs={periodLogs} />

      {/* Month calendar */}
      <MonthCalendar logs={heatmapLogs} onDayClick={(dateStr) => navigate(`/history/day/${dateStr}`)} />

      {/* ═══════════════════════ Chi tiết bài tập ═══════════════════════ */}
      <SectionHeader title="Chi tiết bài tập" />

      {/* Exercise period table */}
      <ExercisePeriodTable periodLogs={periodLogs} prevPeriodLogs={prevPeriodLogs} presets={SYSTEM_PRESETS} periodDays={periodDays} prevPeriodDays={prevPeriodDays} />

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

      {/* Volume/tonnage progress */}
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
                      <div className="h-full bg-text-secondary rounded-full transition-all" style={{ width: `${(v.lastWeek / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-secondary w-14 text-right flex-shrink-0">{v.lastWeek} kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bài tập yêu thích */}
      {topExercise && (
        <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Trophy size={20} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">Bài tập yêu thích</p>
            <p className="font-bold text-text-main text-sm">{topExercise}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Kỷ lục & Thành tựu ═══════════════════════ */}
      <SectionHeader title="Kỷ lục & Thành tựu" />

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

      <AchievementsCard logs={logs} profile={profile} />

      {/* ═══════════════════════ Lịch sử ═══════════════════════ */}
      <SectionHeader title="Lịch sử" />

      {recentLogs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-text-secondary text-sm">Chưa có buổi tập nào được ghi lại</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border px-3 pt-1 mb-4">
          {weekGroups.map(({ label, logs: wLogs }) => (
            <div key={label}>
              <div className="flex items-center gap-3 pt-3 pb-1">
                <p className="text-xs font-black text-text-secondary tracking-wide uppercase">{label}</p>
                <div className="flex-1 h-px bg-border" />
                <p className="text-xs text-text-muted">{wLogs.length} buổi</p>
              </div>
              <div>
                {wLogs.map((log) => (
                  <LogRow key={log.id} log={log} onClick={() => navigate(`/history/day/${log.date}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/programs')}
        className="w-full py-4 border border-border rounded-2xl text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
        Xem chương trình tập →
      </button>
    </div>
  );
}
