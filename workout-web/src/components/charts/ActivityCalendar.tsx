import { useMemo } from 'react';
import { WorkoutLog } from '../../types/workout';
import { logMinutes } from '../../lib/energy';
import { todayString, formatDateVi } from '../../lib/date';

// GitHub-style calendar heatmap of the last N weeks — distinct from
// HourHeatmap (hour-of-day × weekday); this is calendar day × week.
const WEEKS_COUNT = 12;
const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
// 5-level orange scale (same ramp as HourHeatmap); index 0 (no activity) is
// rendered with bg-card-2 instead, so this array only needs the 4 "has
// activity" hex steps.
const LEVEL_HEX = ['', '#FFE4D6', '#FFB894', '#FF8A50', '#FF5400'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mondayOfDate(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7; // 0=Mon..6=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - dow);
  return mon;
}

interface ActivityCalendarProps {
  logs: WorkoutLog[];
}

export default function ActivityCalendar({ logs }: ActivityCalendarProps) {
  const { grid, windowStart, max } = useMemo(() => {
    const todayMonday = mondayOfDate(todayString());
    const windowStart = new Date(todayMonday);
    windowStart.setDate(todayMonday.getDate() - (WEEKS_COUNT - 1) * 7);
    const windowStartStr = toDateStr(windowStart);

    // grid[dowIdx][weekIdx] — weekIdx 0 = oldest week, WEEKS_COUNT-1 = current week.
    const g: number[][] = Array.from({ length: 7 }, () => new Array(WEEKS_COUNT).fill(0));

    for (const log of logs) {
      if (!log.date || log.date < windowStartStr) continue;
      const d = new Date(log.date + 'T00:00:00');
      if (Number.isNaN(d.getTime())) continue;
      const diffDays = Math.round((d.getTime() - windowStart.getTime()) / 86_400_000);
      if (diffDays < 0) continue;
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= WEEKS_COUNT) continue;
      const dowIdx = (d.getDay() + 6) % 7;
      g[dowIdx][weekIdx] += logMinutes(log);
    }

    let max = 0;
    for (const row of g) for (const v of row) if (v > max) max = v;
    return { grid: g, windowStart, max };
  }, [logs]);

  const levelOf = (v: number): number => {
    if (v <= 0 || max <= 0) return 0;
    return Math.min(4, Math.max(1, Math.ceil((v / max) * 4)));
  };

  const dateAt = (weekIdx: number, dowIdx: number): string => {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + weekIdx * 7 + dowIdx);
    return toDateStr(d);
  };

  const today = todayString();

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-1">Lịch nhiệt hoạt động</p>
      <p className="text-xs text-text-secondary mb-3">Mỗi ô là 1 ngày, càng đậm càng tập nhiều phút — {WEEKS_COUNT} tuần gần nhất</p>

      {max === 0 ? (
        <p className="text-xs text-text-secondary text-center py-10">Chưa có dữ liệu hoạt động</p>
      ) : (
        <div className="space-y-0.5">
          {DOW_LABELS.map((label, dowIdx) => (
            <div
              key={label}
              style={{ display: 'grid', gridTemplateColumns: `auto repeat(${WEEKS_COUNT}, minmax(0,1fr))`, gap: '3px' }}
              className="items-center"
            >
              <div className="w-6 flex-shrink-0 text-[9px] font-semibold text-text-muted">{label}</div>
              {Array.from({ length: WEEKS_COUNT }, (_, weekIdx) => {
                const v = grid[dowIdx][weekIdx];
                const level = levelOf(v);
                const ds = dateAt(weekIdx, dowIdx);
                const isToday = ds === today;
                return (
                  <div
                    key={weekIdx}
                    title={`${formatDateVi(ds)} — ${Math.round(v)} phút`}
                    className={`aspect-square rounded-sm ${level === 0 ? 'bg-card-2' : ''} ${isToday ? 'ring-1 ring-primary' : ''}`}
                    style={level > 0 ? { backgroundColor: LEVEL_HEX[level] } : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-text-muted">Ít</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className={`w-3 h-3 rounded-sm ${lvl === 0 ? 'bg-card-2' : ''}`}
            style={lvl > 0 ? { backgroundColor: LEVEL_HEX[lvl] } : undefined}
          />
        ))}
        <span className="text-[10px] text-text-muted">Nhiều</span>
      </div>
    </div>
  );
}
