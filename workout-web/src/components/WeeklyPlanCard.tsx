import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { computeWeeklyPlan, mondayOf, WeeklyPlanItem, WeeklyPlanScore } from '../lib/weeklyPlan';
import { todayString, daysAgoString } from '../lib/date';

interface WeeklyPlanCardProps {
  logs: WorkoutLog[];
  profile: UserProfile | null;
}

// Same display convention as GoalsStrip's formatGoalLabel: reps show as
// "x/y cái", durations show minutes once the target reaches a minute —
// never raw seconds.
function formatItemProgress(it: WeeklyPlanItem): string {
  if (!it.isDuration) return `${it.done}/${it.target} cái`;
  if (it.target >= 60) return `${Math.round(it.done / 60)}/${Math.round(it.target / 60)} phút`;
  return `${it.done}/${it.target}s`;
}

function buildTip(thisWeek: WeeklyPlanScore, lastWeek: WeeklyPlanScore | null): string {
  if (thisWeek.score >= 100) return '💡 Tuyệt vời! Đạt 100% kế hoạch tuần 🎉';

  if (lastWeek && lastWeek.items.length > 0) {
    const worst = lastWeek.items.reduce((min, it) => (it.pct < min.pct ? it : min), lastWeek.items[0]);
    if (worst.pct < 70) {
      return `💡 Tuần trước hụt ${worst.name} (${worst.pct}%) — ưu tiên bài này tuần này`;
    }
  }

  if (lastWeek) {
    const delta = thisWeek.score - lastWeek.score;
    if (delta > 0) return `💡 Duy trì phong độ — hơn tuần trước ${delta}%!`;
    return '💡 Duy trì phong độ tập luyện!';
  }

  return '💡 Duy trì phong độ tập luyện!';
}

export default function WeeklyPlanCard({ logs, profile }: WeeklyPlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { thisWeek, lastWeek } = useMemo(() => {
    const thisWeekStart = mondayOf(todayString());
    const lastWeekStart = mondayOf(daysAgoString(7));
    return {
      thisWeek: computeWeeklyPlan(logs, profile, thisWeekStart),
      lastWeek: computeWeeklyPlan(logs, profile, lastWeekStart),
    };
  }, [logs, profile]);

  if (!thisWeek && !lastWeek) return null;

  // If only last week had scoreable goals/minutes (e.g. user just disabled
  // all goals and removed weeklyGoalMinutes), there's nothing meaningful to
  // show for "this week" — hide rather than render a broken 0-only card.
  if (!thisWeek) return null;

  const delta = lastWeek ? thisWeek.score - lastWeek.score : null;
  const tip = buildTip(thisWeek, lastWeek);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-xs font-bold text-text-secondary mb-2">📋 Kế hoạch tuần</p>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-black text-primary">{thisWeek.score}%</span>
        {delta !== null && delta !== 0 && (
          <span className={`text-xs font-bold mb-1 ${delta > 0 ? 'text-success' : 'text-danger'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-16 flex-shrink-0">Tuần này</span>
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${thisWeek.score}%` }} />
          </div>
          <span className="text-xs text-text-secondary w-10 text-right flex-shrink-0">{thisWeek.score}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-16 flex-shrink-0">Tuần trước</span>
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-text-secondary rounded-full transition-all" style={{ width: `${lastWeek ? lastWeek.score : 0}%` }} />
          </div>
          <span className="text-xs text-text-secondary w-10 text-right flex-shrink-0">{lastWeek ? `${lastWeek.score}%` : '—'}</span>
        </div>
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-text-secondary py-1 border-t border-border"
      >
        {expanded ? 'Thu gọn' : 'Xem chi tiết'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2.5">
          {thisWeek.items.map((it) => (
            <div key={it.presetId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-text-main truncate max-w-[60%]">{it.name}</span>
                <span className="text-xs text-text-secondary">{formatItemProgress(it)}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${it.pct >= 100 ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${it.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-secondary mt-3 pt-2 border-t border-border">{tip}</p>
    </div>
  );
}
