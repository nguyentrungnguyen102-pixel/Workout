import { WorkoutLog } from '../types/workout';
import { buildMuscleRecovery, RecoveryStatus } from '../lib/muscleRecovery';

interface MuscleRecoveryCardProps {
  recentLogs: WorkoutLog[];
}

// No dedicated "warning" token in tailwind.config.js — reuses primary
// (brand orange) for the in-between "recovering" state rather than adding
// a new color to the shared palette for one card.
const STATUS_META: Record<RecoveryStatus, { label: string; dot: string; text: string }> = {
  trained_today: { label: 'Vừa tập', dot: 'bg-danger', text: 'text-danger' },
  recovering: { label: 'Đang hồi phục', dot: 'bg-primary', text: 'text-primary' },
  ready: { label: 'Sẵn sàng', dot: 'bg-success', text: 'text-success' },
  no_data: { label: 'Chưa có dữ liệu', dot: 'bg-border', text: 'text-text-muted' },
};

function statusOrder(status: RecoveryStatus): number {
  // Groups worth training today float to the top: ready first, then unknown
  // (may as well try), recovering, trained_today last.
  return { ready: 0, no_data: 1, recovering: 2, trained_today: 3 }[status];
}

// "Hồi phục nhóm cơ" — the same idea top fitness apps (Fitbod, Freeletics)
// surface to answer "nhóm cơ nào nên tập hôm nay": trained today or
// yesterday reads as still recovering, 2+ days clear reads as ready. A
// same-day nudge, deliberately separate from the "Đánh giá thể lực" composite
// score in CoachInsights (see lib/muscleRecovery.ts's header comment).
export default function MuscleRecoveryCard({ recentLogs }: MuscleRecoveryCardProps) {
  const rows = buildMuscleRecovery(recentLogs).sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
  const readyGroups = rows.filter((r) => r.status === 'ready' || r.status === 'no_data');

  return (
    <div className="rounded-2xl border border-border bg-card mb-3 p-3">
      <p className="text-xs font-bold text-text-secondary mb-2">🔋 Hồi phục nhóm cơ</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
        {rows.map((row) => {
          const meta = STATUS_META[row.status];
          return (
            <div key={row.group} className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-xs text-text-main truncate">{row.label}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold shrink-0 ${meta.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
      {readyGroups.length > 0 && (
        <p className="text-xs text-text-secondary pt-2 border-t border-border">
          💡 Sẵn sàng tập: <span className="font-bold text-text-main">{readyGroups.map((r) => r.label).join(', ')}</span>
        </p>
      )}
    </div>
  );
}
