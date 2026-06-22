import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getLogsForHeatmap, getRecentLogs } from '../services/workoutService';
import { WorkoutLog } from '../types/workout';
import { getWeekLabel, formatTimeOfDay, formatDayOfWeekVi, formatDateVi } from '../lib/date';
import { buildDayTimeline } from '../lib/dayTimeline';
import { formatAmount } from '../lib/format';

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  strength: { text: '#FF5400', bg: '#FFF0EC' },
  cardio:   { text: '#2563EB', bg: '#EFF6FF' },
  mobility: { text: '#059669', bg: '#ECFDF5' },
  recovery: { text: '#7C3AED', bg: '#F5F3FF' },
  dumbbell: { text: '#D97706', bg: '#FEF3C7' },
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const timeStr = formatTimeOfDay(log.startedAt ?? log.createdAt);
  const isStarted = !!log.startedAt;

  return (
    <button onClick={onClick}
      className="w-full bg-card rounded-2xl border border-border text-left hover:border-primary/40 active:scale-[0.99] transition-all overflow-hidden flex">
      <div className="w-1 self-stretch flex-shrink-0 bg-primary/30" />

      <div className="flex-1 p-4 min-w-0">
        {/* Row 1: date + time pill */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-text-main">{formatDayOfWeekVi(log.date)}</span>
            <span className="text-sm text-text-secondary">{formatDateVi(log.date)}</span>
          </div>
          {timeStr && (
            <span className="text-xs font-semibold text-text-secondary bg-card-2 px-2 py-0.5 rounded-full flex-shrink-0 ml-2 whitespace-nowrap">
              {isStarted ? '' : 'Lưu '}{timeStr}
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

        {/* Row 3: stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">{log.totalDurationMinutes} phút</span>
          </div>
          <span className="text-xs font-semibold text-text-secondary">{log.caloriesEstimate} kcal</span>
        </div>
      </div>
    </button>
  );
}

interface MonthCalendarProps {
  viewMonth: Date;
  logsByDate: Map<string, WorkoutLog[]>;
  today: string;
  onDayClick: (dateStr: string) => void;
}

function MonthCalendar({ viewMonth, logsByDate, today, onDayClick }: MonthCalendarProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Day of week for first day (0=Sun, 1=Mon...), convert to Mon-based (0=Mon..6=Sun)
  const firstDow = (firstDay.getDay() + 6) % 7;

  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Total cells = leading empty + days in month, round up to full weeks
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const cells: Array<{ dateStr: string | null; dayNum: number | null; isCurrentMonth: boolean }> = [];

  // Leading days from prev month
  for (let i = 0; i < firstDow; i++) {
    const d = new Date(year, month, 1 - (firstDow - i));
    cells.push({ dateStr: toDateStr(d), dayNum: d.getDate(), isCurrentMonth: false });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ dateStr: toDateStr(date), dayNum: d, isCurrentMonth: true });
  }

  // Trailing days from next month
  const trailing = totalCells - cells.length;
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ dateStr: toDateStr(d), dayNum: i, isCurrentMonth: false });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="text-center py-1">
            <span className="text-[10px] font-semibold text-text-muted">{d}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const isCurrentWeek = week.some(c => c.dateStr === today);
          const maxItems = isCurrentWeek ? 6 : 3;
          return (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(({ dateStr, dayNum, isCurrentMonth }) => {
              if (!dateStr) return <div key={`empty-${wi}`} />;
              const logs = logsByDate.get(dateStr) || [];
              const hasLogs = logs.length > 0;
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const timeline = hasLogs ? buildDayTimeline(logs) : [];
              const extraCount = timeline.length > maxItems ? timeline.length - maxItems : 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => hasLogs && onDayClick(dateStr)}
                  className={`${isCurrentWeek ? 'min-h-[144px]' : 'min-h-[72px]'} rounded-xl p-1 text-left transition-all ${
                    hasLogs ? 'cursor-pointer hover:opacity-80' : ''
                  } ${
                    hasLogs ? 'bg-primary-light' : 'bg-card-2'
                  } ${
                    isToday ? 'ring-2 ring-primary' : ''
                  } ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${
                    isFuture ? 'opacity-20' : ''
                  }`}>
                  <div className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-primary' : 'text-text-secondary'}`}>
                    {dayNum}
                  </div>
                  {timeline.slice(0, maxItems).map((item, idx) => (
                    <div key={idx} className="text-[9px] text-text-main leading-tight truncate">
                      {item.time ? `${item.time} ` : ''}{item.name} {formatAmount(item.ex)}
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div className="text-[9px] text-primary font-semibold">+{extraCount}</div>
                  )}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useUserStore();
  const [heatmapLogs, setHeatmapLogs] = useState<WorkoutLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Month calendar state: first of the displayed month
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      getLogsForHeatmap(uid, '2000-01-01'),
      getRecentLogs(uid, 50),
    ]).then(([hm, recent]) => {
      setHeatmapLogs(hm);
      setRecentLogs(recent);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid]);

  const today = toDateStr(new Date());
  const totalSessions = heatmapLogs.length;
  const weekGroups = groupByWeek(recentLogs);

  const thisWeekLogs = weekGroups[0]?.label === 'Tuần này' ? weekGroups[0].logs : [];
  const thisWeekMinutes = thisWeekLogs.reduce((s, l) => s + l.totalDurationMinutes, 0);

  // Group all logs by date for calendar
  const logsByDate = new Map<string, WorkoutLog[]>();
  for (const log of heatmapLogs) {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date)!.push(log);
  }

  const monthLabel = viewMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  // Format as "Tháng M, YYYY"
  const monthNum = viewMonth.getMonth() + 1;
  const yearNum = viewMonth.getFullYear();

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  return (
    <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6">
      <h1 className="text-2xl font-black text-text-main mb-4">Lịch sử</h1>

      {/* Stats strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-primary">{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">tổng buổi</p>
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

      {/* Month calendar */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-card-2 transition-colors">
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <h2 className="text-sm font-bold text-text-main">Tháng {monthNum}, {yearNum}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-card-2 transition-colors">
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MonthCalendar
            viewMonth={viewMonth}
            logsByDate={logsByDate}
            today={today}
            onDayClick={(dateStr) => navigate(`/history/day/${dateStr}`)}
          />
        )}
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
