import { useMemo, useState } from 'react';
import { WorkoutLog } from '../types/workout';
import { estimateLogMinutes } from '../lib/weeklyPlan';
import { logMinutes } from '../lib/energy';
import { todayString, formatDateVi } from '../lib/date';

// Merged heatmap card (v2.14.0) — was two separate orange-grid cards
// (HourHeatmap: hour-of-day × weekday; ActivityCalendar: calendar day ×
// week) that looked near-identical and cluttered the page. Now a single
// card with a pill toggle between the two views; the grid-building logic
// below is carried over unchanged from each original component.

type View = 'day' | 'hour';

// Shared 5-level orange scale (same ramp both originals used); index 0 (no
// activity) renders with bg-card-2 instead, so this only needs the 4
// "has activity" hex steps.
const LEVEL_HEX = ['', '#FFE4D6', '#FFB894', '#FF8A50', '#FF5400'];

function levelOf(v: number, max: number): number {
  if (v <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((v / max) * 4)));
}

function HeatLegend() {
  return (
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
  );
}

// --- Theo ngày (calendar day × week, last 12 weeks) — from ActivityCalendar ---

const WEEKS_COUNT = 12;
const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

function DayView({ logs }: { logs: WorkoutLog[] }) {
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

  const dateAt = (weekIdx: number, dowIdx: number): string => {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + weekIdx * 7 + dowIdx);
    return toDateStr(d);
  };

  const today = todayString();

  return (
    <>
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
                const level = levelOf(v, max);
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
      <HeatLegend />
    </>
  );
}

// --- Theo khung giờ (hour-of-day × weekday) — from HourHeatmap ---

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5h..22h
const HOUR_LABEL_SET = new Set([5, 8, 11, 14, 17, 20, 22]);

function HourView({ logs }: { logs: WorkoutLog[] }) {
  const { grid, max } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => new Array(HOURS.length).fill(0));
    for (const log of logs) {
      // Logs missing createdAt have no reliable time-of-day — skip rather
      // than guess a bucket (per spec: don't assume noon/whatever).
      if (!log.createdAt) continue;
      if (!log.date) continue;
      let hour: number;
      try {
        hour = log.createdAt.toDate().getHours();
      } catch {
        continue;
      }
      const colIdx = HOURS.indexOf(hour);
      if (colIdx === -1) continue; // outside the 5h-22h window shown

      const d = new Date(log.date + 'T00:00:00');
      if (isNaN(d.getTime())) continue;
      const dowIdx = (d.getDay() + 6) % 7; // 0=Mon..6=Sun

      g[dowIdx][colIdx] += estimateLogMinutes(log);
    }
    let m = 0;
    for (const row of g) for (const v of row) if (v > m) m = v;
    return { grid: g, max: m };
  }, [logs]);

  return (
    <>
      <p className="text-xs text-text-secondary mb-3">Càng đậm càng hay tập vào khung giờ đó trong ngày</p>

      <div>
        {/* Hour header row — same grid template as the day rows below so
            the hour labels line up exactly with their columns. */}
        <div
          className="mb-1"
          style={{ display: 'grid', gridTemplateColumns: 'auto repeat(18, minmax(0,1fr))', gap: '2px' }}
        >
          <div className="w-6" />
          {HOURS.map((h) => (
            <div key={h} className="text-center">
              <span className="text-[8px] text-text-muted">{HOUR_LABEL_SET.has(h) ? h : ''}</span>
            </div>
          ))}
        </div>

        {/* Day rows */}
        <div className="space-y-0.5">
          {DOW_LABELS.map((label, dowIdx) => (
            <div
              key={label}
              style={{ display: 'grid', gridTemplateColumns: 'auto repeat(18, minmax(0,1fr))', gap: '2px' }}
              className="items-center"
            >
              <div className="w-6 flex-shrink-0 text-[9px] font-semibold text-text-muted">{label}</div>
              {HOURS.map((h, colIdx) => {
                const v = grid[dowIdx][colIdx];
                const level = levelOf(v, max);
                const isMax = max > 0 && v === max;
                return (
                  <div
                    key={h}
                    title={`${label} ${h}h — ${Math.round(v)} phút`}
                    className={`w-full aspect-square rounded-sm ${level === 0 ? 'bg-card-2' : ''} ${isMax ? 'ring-1 ring-primary' : ''}`}
                    style={level > 0 ? { backgroundColor: LEVEL_HEX[level] } : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <HeatLegend />

      {max === 0 && (
        <p className="text-xs text-text-secondary mt-2 text-center">Chưa có dữ liệu giờ tập trong kỳ này</p>
      )}
    </>
  );
}

interface ActivityHeatmapProps {
  // Full log history — drives the "Theo ngày" calendar view (last 12 weeks,
  // independent of the Tuần/Tháng/Quý period filter).
  allLogs: WorkoutLog[];
  // Period-filtered logs — drives the "Theo khung giờ" hour-of-day view (so
  // it respects whatever period the user has selected above).
  periodLogs: WorkoutLog[];
}

export default function ActivityHeatmap({ allLogs, periodLogs }: ActivityHeatmapProps) {
  const [view, setView] = useState<View>('day');

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-bold text-text-main">🔥 Nhiệt hoạt động</p>
        <div className="flex gap-1 p-0.5 bg-card-2 rounded-lg flex-shrink-0">
          {([
            { key: 'day', label: 'Theo ngày' },
            { key: 'hour', label: 'Theo khung giờ' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setView(opt.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                view === opt.key ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'day' ? <DayView logs={allLogs} /> : <HourView logs={periodLogs} />}
    </div>
  );
}
