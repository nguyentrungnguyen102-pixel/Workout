import { useMemo } from 'react';
import { WorkoutLog } from '../types/workout';
import { estimateLogMinutes } from '../lib/weeklyPlan';

const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5h..22h
const HOUR_LABEL_SET = new Set([5, 8, 11, 14, 17, 20, 22]);
// 5-level orange scale; index 0 (no activity) is rendered with bg-card-2
// instead, so this array only needs the 4 "has activity" hex steps.
const LEVEL_HEX = ['', '#FFE4D6', '#FFB894', '#FF8A50', '#FF5400'];

interface HourHeatmapProps {
  logs: WorkoutLog[];
}

export default function HourHeatmap({ logs }: HourHeatmapProps) {
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

  const levelOf = (v: number): number => {
    if (v <= 0 || max <= 0) return 0;
    return Math.min(4, Math.max(1, Math.ceil((v / max) * 4)));
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-3">🕐 Khung giờ tập</p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-[380px]">
          {/* Hour header row */}
          <div className="flex gap-0.5 mb-1 pl-6">
            {HOURS.map((h) => (
              <div key={h} className="w-4 flex-shrink-0 text-center">
                <span className="text-[8px] text-text-muted">{HOUR_LABEL_SET.has(h) ? h : ''}</span>
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="space-y-0.5">
            {DOW_LABELS.map((label, dowIdx) => (
              <div key={label} className="flex items-center gap-0.5">
                <div className="w-6 flex-shrink-0 text-[9px] font-semibold text-text-muted">{label}</div>
                {HOURS.map((h, colIdx) => {
                  const v = grid[dowIdx][colIdx];
                  const level = levelOf(v);
                  const isMax = max > 0 && v === max;
                  return (
                    <div
                      key={h}
                      title={`${label} ${h}h — ${Math.round(v)} phút`}
                      className={`w-4 h-4 flex-shrink-0 rounded-sm ${level === 0 ? 'bg-card-2' : ''} ${isMax ? 'ring-1 ring-primary' : ''}`}
                      style={level > 0 ? { backgroundColor: LEVEL_HEX[level] } : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

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

      {max === 0 && (
        <p className="text-xs text-text-secondary mt-2 text-center">Chưa có dữ liệu giờ tập trong kỳ này</p>
      )}
    </div>
  );
}
