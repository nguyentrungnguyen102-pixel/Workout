import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { buildCoachInsights } from '../lib/coach';

interface CoachInsightsProps {
  allLogs: WorkoutLog[];
  periodLogs: WorkoutLog[];
  prevPeriodLogs: WorkoutLog[];
  profile: UserProfile | null;
  periodLabel: string;
}

export default function CoachInsights({ allLogs, periodLogs, prevPeriodLogs, profile, periodLabel }: CoachInsightsProps) {
  const insights = buildCoachInsights(allLogs, periodLogs, prevPeriodLogs, profile, periodLabel);

  if (insights.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      <p className="text-sm font-bold text-text-main mb-3">🧠 HLV nhận xét</p>
      <div className="space-y-2">
        {insights.map((line, i) => (
          <p key={i} className="text-sm text-text-main">{line}</p>
        ))}
      </div>
    </div>
  );
}
