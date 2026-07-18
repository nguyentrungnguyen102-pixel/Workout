import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { buildCoachInsights, buildCoachAssessment } from '../lib/coach';

interface CoachInsightsProps {
  allLogs: WorkoutLog[];
  periodLogs: WorkoutLog[];
  prevPeriodLogs: WorkoutLog[];
  profile: UserProfile | null;
  periodLabel: string;
  periodDays: number;
  prevPeriodDays: number;
}

export default function CoachInsights({ allLogs, periodLogs, prevPeriodLogs, profile, periodLabel, periodDays, prevPeriodDays }: CoachInsightsProps) {
  const insights = buildCoachInsights(allLogs, periodLogs, prevPeriodLogs, profile, periodLabel, periodDays, prevPeriodDays);
  const assessment = buildCoachAssessment(allLogs, profile);

  if (insights.length === 0 && !assessment) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4">
      {assessment && (
        <div className="mb-4 pb-4 border-b border-border space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{assessment.emoji}</span>
            <p className="text-sm font-black text-text-main">Trình độ: {assessment.level}</p>
          </div>
          <p className="text-xs text-text-secondary">{assessment.reason}</p>
          <p className="text-sm text-text-main">{assessment.verdict}</p>
          <p className="text-sm text-text-main">{assessment.improve}</p>
          <p className="text-xs text-text-secondary">{assessment.tip}</p>
        </div>
      )}

      {insights.length > 0 && (
        <>
          <p className="text-sm font-bold text-text-main mb-3">🧠 HLV nhận xét</p>
          <div className="space-y-2">
            {insights.map((line, i) => (
              <p key={i} className="text-sm text-text-main">{line}</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
