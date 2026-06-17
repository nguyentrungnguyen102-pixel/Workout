import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Zap } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForHeatmap, getRecentLogs } from '../services/workoutService';
import { WorkoutLog } from '../types/workout';
import { getWeekLabel, formatTimeOfDay, formatDayOfWeekVi, formatDateVi } from '../lib/date';

const HEATMAP_COLORS: Record<string, string> = {
  light: '#FFD8C8',
  moderate: '#FF9970',
  heavy: '#FF5400',
};

const INTENSITY_TEXT: Record<string, string> = {
  light: '#059669',
  moderate: '#D97706',
  heavy: '#DC2626',
};

const INTENSITY_BG: Record<string, string> = {
  light: '#ECFDF5',
  moderate: '#FEF3C7',
  heavy: '#FFEBEE',
};

const INTENSITY_LABELS: Record<string, string> = {
  light: 'Nhẹ',
  moderate: 'Vừa',
  heavy: 'Nặng',
};

const INTENSITY_BAR: Record<string, string> = {
  light: '#1DAA60',
  moderate: '#D97706',
  heavy: '#E53935',
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  strength: { text: '#FF5400', bg: '#FFF0EC' },
  cardio:   { text: '#2563EB', bg: '#EFF6FF' },
  mobility: { text: '#059669', bg: '#ECFDF5' },
  recovery: { text: '#7C3AED', bg: '#F5F3FF' },
  dumbbell: { text: '#D97706', bg: '#FEF3C7' },
};

const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getStartDate90(): string {
  const d = new Date();
  d.setDate(d.getDate() - 89);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildHeatmapGrid(logs: WorkoutLog[], startDate: string): Array<{ date: string; intensity: string | null }> {
  const map = new Map<string, string>();
  for (const log of logs) {
    const existing = map.get(log.date);
    if (!existing || log.intensity === 'heavy' || (log.intensity === 'moderate' && existing === 'light')) {
      map.set(log.date, log.intensity);
    }
  }
  const cells: Array<{ date: string; intensity: string | null }> = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < 91; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    cells.push({ date: s, intensity: map.get(s) ?? null });
  }
  return cells;
}

function buildMonthLabels(startDate: string, startDow: number, columns: number): Array<{ col: number; label: string }> {
  const result: Array<{ col: number; label: string }> = [];
  const start = new Date(startDate + 'T00:00:00');
  let lastMonth = -1;
  for (let col = 0; col < columns; col++) {
    // First col may be padded — compute the actual date of row 0 in this column
    const dayOffset = col * 7 - startDow;
    if (dayOffset < 0) continue;
    const d = new Date(start);
    d.setDate(start.getDate() + dayOffset);
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      result.push({ col, label: d.toLocaleString('vi-VN', { month: 'short' }) });
    }
  }
  return result;
}

function groupByWeek(logs: WorkoutLog[]): Array<{ label: string; logs: WorkoutLog[] }> {
  const map = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    const label = getWeekLabel(log.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(log);
  }
  return Array.from(map.entries()).map(([label, logs]) => ({ label, logs }));
}

interface SessionCardProps {
  log: WorkoutLog;
  onClick: () => void;
}

function SessionCard({ log, onClick }: SessionCardProps) {
  const timeStr = formatTimeOfDay(log.startedAt);
  const barColor = INTENSITY_BAR[log.intensity] || '#E8E7E2';

  return (
    <button onClick={onClick}
      className="w-full bg-card rounded-2xl border border-border text-left hover:border-primary/40 active:scale-[0.99] transition-all overflow-hidden flex">
      <div className="w-1 self-stretch flex-shrink-0" style={{ backgroundColor: barColor }} />

      <div className="flex-1 p-4 min-w-0">
        {/* Row 1: date + time pill */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-text-main">{formatDayOfWeekVi(log.date)}</span>
            <span className="text-sm text-text-secondary">{formatDateVi(log.date)}</span>
          </div>
          {timeStr && (
            <span className="text-xs font-semibold text-text-secondary bg-card-2 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
              {timeStr}
            </span>
          )}
        </div>

        {/* Row 2: exercise tags with category colors */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {log.exercises.slice(0, 4).map((ex) => {
            const cc = CATEGORY_COLORS[ex.category] || { text: '#8A8A8A', bg: '#F3F2EE' };
            return (
              <span key={ex.presetId}
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: cc.text, backgroundColor: cc.bg }}>
                {ex.name}
              </span>
            );
          })}
          {log.exercises.length > 4 && (
            <span className="text-xs font-semibold text-text-muted px-1">
              +{log.exercises.length - 4}
            </span>
          )}
        </div>

        {/* Row 3: stats + intensity badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">{log.totalDurationMinutes} phút</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={11} className="text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">{log.caloriesEstimate} kcal</span>
          </div>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ color: INTENSITY_TEXT[log.intensity], backgroundColor: INTENSITY_BG[log.intensity] }}>
            {INTENSITY_LABELS[log.intensity]}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const [heatmapLogs, setHeatmapLogs] = useState<WorkoutLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = firebaseUser?.uid;
  const startDate = getStartDate90();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      getLogsForHeatmap(uid, startDate),
      getRecentLogs(uid, 50),
    ]).then(([hm, recent]) => {
      setHeatmapLogs(hm);
      setRecentLogs(recent);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid]);

  const cells = buildHeatmapGrid(heatmapLogs, startDate);
  const totalSessions = heatmapLogs.length;
  const startDow = new Date(startDate + 'T00:00:00').getDay();
  // Pad from Sunday=0 perspective: need startDow empty slots before first date
  const paddedCells = [...Array(startDow).fill(null), ...cells];
  const columns = Math.ceil(paddedCells.length / 7);
  const monthLabels = buildMonthLabels(startDate, startDow, columns);
  const weekGroups = groupByWeek(recentLogs);

  const thisWeekLogs = weekGroups[0]?.label === 'Tuần này' ? weekGroups[0].logs : [];
  const thisWeekMinutes = thisWeekLogs.reduce((s, l) => s + l.totalDurationMinutes, 0);

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6">
      <h1 className="text-2xl font-black text-text-main mb-4">Lịch sử</h1>

      {/* Stats strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-primary">{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">buổi / 90 ngày</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-text-main">{thisWeekLogs.length}</p>
            <p className="text-xs text-text-secondary mt-0.5">buổi tuần này</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-text-main">{thisWeekMinutes}</p>
            <p className="text-xs text-text-secondary mt-0.5">phút tuần này</p>
          </div>
        </div>
      )}

      {/* Heatmap card */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-main">90 ngày qua</p>
          <p className="text-sm font-bold text-primary">{totalSessions} buổi</p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {/* Day-of-week labels column */}
            <div className="flex flex-col gap-[3px] mr-1">
              {/* spacer for month row */}
              <div className="h-4" />
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                <div key={dow} className="w-5 h-3.5 flex items-center justify-end">
                  {/* Show T2, T4, T6 only to avoid clutter */}
                  {(dow === 1 || dow === 3 || dow === 5) && (
                    <span className="text-[9px] text-text-muted font-medium">{DOW_LABELS[dow]}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Heatmap + month labels */}
            <div>
              {/* Month label row */}
              <div className="relative h-4 mb-[3px]"
                style={{ width: `${columns * (14 + 3)}px` }}>
                {monthLabels.map(({ col, label }) => (
                  <span key={col}
                    className="absolute text-[9px] text-text-muted font-semibold uppercase"
                    style={{ left: `${col * (14 + 3)}px`, top: 0 }}>
                    {label}
                  </span>
                ))}
              </div>

              {/* Heatmap grid — gridAutoFlow: column so cells fill top→bottom within each week column */}
              <div className="grid gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 14px)`,
                  gridTemplateRows: 'repeat(7, 14px)',
                  gridAutoFlow: 'column',
                }}>
                {paddedCells.map((cell, idx) => {
                  if (!cell) return <div key={`p-${idx}`} className="w-3.5 h-3.5 rounded-sm" />;
                  const bg = cell.intensity ? HEATMAP_COLORS[cell.intensity] : '#E8E7E2';
                  return (
                    <div key={cell.date}
                      className="w-3.5 h-3.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: bg }}
                      title={`${cell.date}${cell.intensity ? ` · ${INTENSITY_LABELS[cell.intensity]}` : ''}`} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-text-secondary">Cường độ:</span>
          {(['#E8E7E2', '#FFD8C8', '#FF9970', '#FF5400'] as const).map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              <span className="text-xs text-text-secondary">{['Nghỉ', 'Nhẹ', 'Vừa', 'Nặng'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week-grouped session list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recentLogs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-text-secondary text-sm">Chưa có buổi tập nào được ghi lại</p>
        </div>
      ) : (
        <div className="space-y-6">
          {weekGroups.map(({ label, logs }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-black text-text-secondary tracking-wide uppercase">{label}</p>
                <div className="flex-1 h-px bg-border" />
                <p className="text-xs text-text-muted">{logs.length} buổi</p>
              </div>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {logs.map((log) => (
                  <SessionCard key={log.id} log={log} onClick={() => navigate(`/history/${log.id}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
