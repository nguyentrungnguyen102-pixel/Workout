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
      {/* Left intensity accent bar */}
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

        {/* Row 2: exercise tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {log.exercises.slice(0, 4).map((ex) => (
            <span key={ex.presetId}
              className="text-xs font-semibold bg-card-2 text-text-secondary px-2 py-0.5 rounded-full">
              {ex.name}
            </span>
          ))}
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
      getRecentLogs(uid, 30),
    ]).then(([hm, recent]) => {
      setHeatmapLogs(hm);
      setRecentLogs(recent);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid]);

  const cells = buildHeatmapGrid(heatmapLogs, startDate);
  const totalSessions = heatmapLogs.length;
  const startDow = new Date(startDate + 'T00:00:00').getDay();
  const paddedCells = [...Array(startDow).fill(null), ...cells];
  const columns = Math.ceil(paddedCells.length / 7);
  const weekGroups = groupByWeek(recentLogs);

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6">
      <h1 className="text-2xl font-black text-text-main mb-5">Lịch sử</h1>

      {/* Compact heatmap */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-main">90 ngày qua</p>
          <p className="text-sm font-bold text-primary">{totalSessions} buổi</p>
        </div>
        <div className="overflow-x-auto -mx-1">
          <div className="grid gap-[3px] min-w-max"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gridTemplateRows: 'repeat(7,1fr)' }}>
            {Array.from({ length: columns }, (_, col) =>
              Array.from({ length: 7 }, (__, row) => {
                const idx = col * 7 + row;
                const cell = paddedCells[idx];
                if (!cell) return <div key={`p-${col}-${row}`} className="w-3.5 h-3.5 rounded-sm" />;
                const bg = cell.intensity ? HEATMAP_COLORS[cell.intensity] : '#E8E7E2';
                return (
                  <div key={cell.date} className="w-3.5 h-3.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: bg }}
                    title={`${cell.date}${cell.intensity ? ` · ${INTENSITY_LABELS[cell.intensity]}` : ''}`} />
                );
              })
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-text-secondary tracking-wide uppercase">{label}</p>
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
