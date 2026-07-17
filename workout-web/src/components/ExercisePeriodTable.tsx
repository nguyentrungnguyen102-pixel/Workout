import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkoutLog, WorkoutPreset } from '../types/workout';
import { CATEGORY_LABELS, SYSTEM_PRESETS } from '../constants/exercises';

interface ExercisePeriodTableProps {
  periodLogs: WorkoutLog[];
  prevPeriodLogs: WorkoutLog[];
  presets?: WorkoutPreset[];
  periodDays: number;
  prevPeriodDays: number;
}

interface ExerciseAgg {
  presetId: string;
  name: string;
  category: string;
  unit: string;
  sessions: number;
  total: number;
  best: number;
}

// Aggregates raw exercise values per presetId across a set of logs.
// - reps: sums raw reps (matches the goal-tracking convention used
//   elsewhere in the app — not sets×reps).
// - seconds/minutes: sums durationSeconds.
// - km: sums distance.
// "best" is the highest single-session (one log) value in the period —
// entries for the same presetId within one log are summed first so a log
// with two Squat entries counts as one session's worth.
function aggregate(logs: WorkoutLog[]): Map<string, ExerciseAgg> {
  const map = new Map<string, ExerciseAgg>();
  for (const log of logs) {
    const perLogValue = new Map<string, number>();
    const meta = new Map<string, { unit: string; category: string; name: string }>();
    for (const ex of log.exercises || []) {
      if (!ex.presetId) continue;
      let v = 0;
      if (ex.unit === 'reps') v = ex.reps || 0;
      else if (ex.unit === 'seconds' || ex.unit === 'minutes') v = ex.durationSeconds || 0;
      else if (ex.unit === 'km') v = ex.distance || 0;
      perLogValue.set(ex.presetId, (perLogValue.get(ex.presetId) || 0) + v);
      if (!meta.has(ex.presetId)) meta.set(ex.presetId, { unit: ex.unit, category: ex.category, name: ex.name });
    }
    for (const [presetId, v] of perLogValue) {
      const m = meta.get(presetId)!;
      const cur = map.get(presetId) || {
        presetId, name: m.name, category: m.category, unit: m.unit, sessions: 0, total: 0, best: 0,
      };
      cur.sessions += 1;
      cur.total += v;
      cur.best = Math.max(cur.best, v);
      map.set(presetId, cur);
    }
  }
  return map;
}

function formatUnitValue(unit: string, value: number, perSession: boolean): string {
  const suffix = perSession ? '/buổi' : '';
  if (unit === 'reps') return `${Math.round(value)} cái${suffix}`;
  if (unit === 'km') return `${value.toFixed(1)} km${suffix}`;
  if (unit === 'minutes') return `${Math.round(value / 60)} phút${suffix}`;
  if (unit === 'seconds') {
    if (value < 60) return `${Math.round(value)}s${suffix}`;
    return `${Math.round(value / 60)} phút${suffix}`;
  }
  return `${value}${suffix}`;
}

function formatSignedUnitValue(unit: string, delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
  return `${sign}${formatUnitValue(unit, Math.abs(delta), false)}`;
}

export default function ExercisePeriodTable({ periodLogs, prevPeriodLogs, presets, periodDays, prevPeriodDays }: ExercisePeriodTableProps) {
  const presetList = presets ?? SYSTEM_PRESETS;

  const { groups, isEmpty } = useMemo(() => {
    const current = aggregate(periodLogs);
    const prev = aggregate(prevPeriodLogs);
    const presetById = new Map(presetList.map((p) => [p.id, p]));
    // Prorate the previous period's totals to the current period's
    // elapsed-day count — same reasoning as coach.ts's buildCoachInsights:
    // callers pass prevPeriodDays === periodDays for two closed periods, so
    // this is a no-op (ratio 1) there.
    const prorateRatio = prevPeriodDays > 0 ? periodDays / prevPeriodDays : 1;

    const byCategory = new Map<string, { sessions: number; rows: Array<{
      presetId: string; icon: string; name: string; sessions: number; totalLabel: string;
      bestLabel: string; deltaNode: 'new' | { positive: boolean; valueLabel: string; pctLabel: string };
    }> }>();

    for (const agg of current.values()) {
      const preset = presetById.get(agg.presetId);
      const icon = preset?.icon || '🏋️';
      const name = preset?.nameVi || agg.name;
      const prevAgg = prev.get(agg.presetId);
      const prevTotalRaw = prevAgg?.total || 0;
      const prevTotal = prevTotalRaw * prorateRatio;
      const delta = agg.total - prevTotal;
      const deltaPct = prevTotal > 0 ? Math.round((delta / prevTotal) * 100) : 0;

      const groupEntry = byCategory.get(agg.category) || { sessions: 0, rows: [] };
      groupEntry.sessions += agg.sessions;
      groupEntry.rows.push({
        presetId: agg.presetId,
        icon,
        name,
        sessions: agg.sessions,
        totalLabel: formatUnitValue(agg.unit, agg.total, false),
        bestLabel: formatUnitValue(agg.unit, agg.best, true),
        deltaNode: prevTotalRaw === 0
          ? 'new'
          : { positive: delta >= 0, valueLabel: formatSignedUnitValue(agg.unit, delta), pctLabel: `${deltaPct >= 0 ? '+' : ''}${deltaPct}%` },
      });
      byCategory.set(agg.category, groupEntry);
    }

    const groupsArr = Array.from(byCategory.entries())
      .map(([category, g]) => ({
        category,
        sessions: g.sessions,
        rows: g.rows.sort((a, b) => b.sessions - a.sessions),
      }))
      .sort((a, b) => b.sessions - a.sessions);

    return { groups: groupsArr, isEmpty: periodLogs.length === 0 };
  }, [periodLogs, prevPeriodLogs, presetList, periodDays, prevPeriodDays]);

  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-3">📋 Chi tiết bài tập trong kỳ</p>

      {isEmpty ? (
        <p className="text-xs text-text-secondary text-center py-4">Chưa có buổi tập trong kỳ này</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.category}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-text-secondary tracking-wide uppercase">
                  {CATEGORY_LABELS[g.category] || g.category}
                </span>
                <span className="text-xs text-text-muted">{g.sessions} buổi</span>
              </div>
              <div className="space-y-1">
                {g.rows.map((row) => (
                  <button key={row.presetId}
                    onClick={() => navigate(`/stats/exercise/${row.presetId}`)}
                    className="w-full flex flex-col gap-1 px-2 py-2 rounded-xl hover:bg-card-2 active:scale-[0.99] transition-all text-left">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{row.icon}</span>
                      <span className="text-sm font-semibold text-text-main truncate flex-1">{row.name}</span>
                      <span className="text-xs text-text-secondary flex-shrink-0">{row.sessions} buổi</span>
                    </span>
                    <span className="flex items-center justify-between gap-2 pl-7 flex-wrap">
                      <span className="text-xs text-text-muted">
                        {row.totalLabel} · TB tốt nhất {row.bestLabel}
                      </span>
                      <span className="text-xs font-bold">
                        {row.deltaNode === 'new' ? (
                          <span className="text-text-muted">mới</span>
                        ) : (
                          <span className={row.deltaNode.positive ? 'text-success' : 'text-danger'}>
                            {row.deltaNode.positive ? '▲' : '▼'} {row.deltaNode.valueLabel} ({row.deltaNode.pctLabel})
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
