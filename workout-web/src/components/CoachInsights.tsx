import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { buildCoachReport } from '../lib/coach';

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
  const report = buildCoachReport(allLogs, periodLogs, prevPeriodLogs, profile, periodLabel, periodDays, prevPeriodDays);

  if (!report) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
      <p className="text-sm font-black text-text-main">🎖️ HLV cá nhân</p>

      {/* Xếp hạng */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-text-main">
            {report.emoji} {report.level}
          </span>
          <span className="text-xs font-bold text-primary bg-primary-light border border-primary/20 rounded-full px-2.5 py-0.5">
            Điểm thể lực {report.score}/100
          </span>
        </div>
        <p className="text-xs text-text-secondary">{report.rankBasis}</p>
      </div>

      {/* Đối chuẩn */}
      {report.benchmarks.length > 0 && (
        <div className="pt-3 border-t border-border space-y-1">
          <p className="text-xs font-bold text-text-main">📐 Đối chuẩn</p>
          {report.benchmarks.map((line, i) => (
            <p key={i} className="text-sm text-text-main">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Tuần này */}
      <div className="pt-3 border-t border-border space-y-1">
        <p className="text-xs font-bold text-text-main">Tuần này</p>
        <p className="text-sm text-text-main">{report.weekLine}</p>
      </div>

      {/* Tiêu điểm */}
      <div className="pt-3 border-t border-border space-y-1">
        <p className="text-xs font-bold text-text-main">Tiêu điểm</p>
        <p className="text-sm font-bold text-text-main">{report.focus}</p>
        <p className="text-xs text-text-secondary">{report.focusTip}</p>
      </div>
    </div>
  );
}
