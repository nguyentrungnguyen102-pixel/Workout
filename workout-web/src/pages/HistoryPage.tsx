import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { getLogsForHeatmap, getRecentLogs } from '../services/workoutService';
import { WorkoutLog } from '../types/workout';

const INTENSITY_COLORS: Record<string, string> = {
  light: '#FFD8C8',
  moderate: '#FF9970',
  heavy: '#FF5400',
};

const INTENSITY_LABELS: Record<string, string> = {
  light: 'Nhẹ',
  moderate: 'Vừa',
  heavy: 'Nặng',
};

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDayOfWeekVi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
}

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
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    cells.push({ date: dateStr, intensity: map.get(dateStr) ?? null });
  }
  return cells;
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
      getRecentLogs(uid, 20),
    ]).then(([hm, recent]) => {
      setHeatmapLogs(hm);
      setRecentLogs(recent);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid]);

  const cells = buildHeatmapGrid(heatmapLogs, startDate);
  const totalSessions = heatmapLogs.length;

  const startDow = new Date(startDate + 'T00:00:00').getDay();
  const paddedCells = [
    ...Array(startDow).fill(null),
    ...cells,
  ];

  const columns = Math.ceil(paddedCells.length / 7);

  return (
    <div className="px-4 pt-6 pb-6">
      <h1 className="text-2xl font-black text-text-main mb-5">Lịch sử</h1>

      <div className="bg-card rounded-2xl p-4 border border-border mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-main">90 ngày qua</p>
          <p className="text-sm font-bold text-primary">{totalSessions} buổi</p>
        </div>

        <div className="overflow-x-auto -mx-1">
          <div
            className="grid gap-1 min-w-max"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: 'repeat(7, 1fr)' }}>
            {Array.from({ length: columns }, (_, col) =>
              Array.from({ length: 7 }, (__, row) => {
                const idx = col * 7 + row;
                const cell = paddedCells[idx];
                if (!cell) {
                  return <div key={`pad-${col}-${row}`} className="w-4 h-4 rounded-sm" />;
                }
                const bg = cell.intensity ? INTENSITY_COLORS[cell.intensity] : '#E8E7E2';
                return (
                  <div key={cell.date} className="w-4 h-4 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: bg }}
                    title={`${cell.date}${cell.intensity ? ` · ${INTENSITY_LABELS[cell.intensity]}` : ''}`}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-text-secondary">Nghỉ</span>
          {['#E8E7E2', '#FFD8C8', '#FF9970', '#FF5400'].map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              <span className="text-xs text-text-secondary">
                {['', 'Nhẹ', 'Vừa', 'Nặng'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

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
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-secondary">GẦN ĐÂY</p>
          {recentLogs.map((log) => (
            <button key={log.id} onClick={() => navigate(`/history/${log.id}`)}
              className="w-full bg-card rounded-2xl p-4 border border-border text-left hover:border-primary/40 transition-colors active:scale-[0.99]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-secondary">{getDayOfWeekVi(log.date)}</span>
                    <span className="text-sm font-bold text-text-main">{formatDateVi(log.date)}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {log.exercises.map((e) => e.name).slice(0, 4).join(' · ')}
                    {log.exercises.length > 4 ? ` +${log.exercises.length - 4}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: INTENSITY_COLORS[log.intensity] }} />
                  <span className="text-xs text-text-secondary">{log.totalDurationMinutes}p</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">{log.caloriesEstimate} kcal</span>
                <span className="text-xs text-text-secondary">{INTENSITY_LABELS[log.intensity]}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
