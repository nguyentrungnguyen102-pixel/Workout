import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { buildDayTimeline } from '../lib/dayTimeline';
import { formatAmount } from '../lib/format';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayCalendarGridProps {
  viewMonth: Date;
  logsByDate: Map<string, WorkoutLog[]>;
  today: string;
  onDayClick: (dateStr: string) => void;
}

function CalendarGrid({ viewMonth, logsByDate, today, onDayClick }: DayCalendarGridProps) {
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
          // Current week gets a taller cell + more visible entries than other
          // weeks (W4: 6→10 items, 144px→240px) so "this week" reads as the
          // primary at-a-glance view of the month.
          const maxItems = isCurrentWeek ? 10 : 3;
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
                  className={`${isCurrentWeek ? 'min-h-[240px]' : 'min-h-[72px]'} rounded-xl p-1 text-left transition-all ${
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

interface MonthCalendarProps {
  logs: WorkoutLog[];
  onDayClick: (dateStr: string) => void;
}

export default function MonthCalendar({ logs, onDayClick }: MonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = toDateStr(new Date());

  const logsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of logs) {
      if (!log.date) continue; // defensive: logs missing `date` can't be placed on the calendar
      if (!map.has(log.date)) map.set(log.date, []);
      map.get(log.date)!.push(log);
    }
    return map;
  }, [logs]);

  const monthNum = viewMonth.getMonth() + 1;
  const yearNum = viewMonth.getFullYear();

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  return (
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

      <CalendarGrid
        viewMonth={viewMonth}
        logsByDate={logsByDate}
        today={today}
        onDayClick={onDayClick}
      />
    </div>
  );
}
