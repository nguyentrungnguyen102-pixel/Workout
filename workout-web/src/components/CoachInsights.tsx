import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WorkoutLog } from '../types/workout';
import { UserProfile } from '../types/user';
import { buildFitnessAssessment, AssessmentDimension } from '../lib/coach';
import { scaleMarkerPercent } from '../lib/standards';
import { useBodyStore } from '../stores/bodyStore';
import { useUserStore } from '../stores/userStore';

interface CoachInsightsProps {
  allLogs: WorkoutLog[];
  periodLogs: WorkoutLog[];
  prevPeriodLogs: WorkoutLog[];
  profile: UserProfile | null;
  periodLabel: string;
  periodDays: number;
  prevPeriodDays: number;
  periodStart: string;
  periodEnd: string;
}

export default function CoachInsights({
  allLogs,
  periodLogs,
  prevPeriodLogs,
  profile,
  periodLabel,
  periodDays,
  prevPeriodDays,
  periodStart,
  periodEnd,
}: CoachInsightsProps) {
  const uid = useUserStore((s) => s.firebaseUser?.uid);
  const latestMetric = useBodyStore((s) => s.latestMetric);
  const metricsLoaded = useBodyStore((s) => s.metrics.length > 0 || s.latestMetric !== null);
  const loadMetrics = useBodyStore((s) => s.loadMetrics);

  // The body store isn't loaded on the Stats route by default, so BMI ("Vóc
  // dáng") would read no bodyweight even after the user entered it. Pull it in
  // here the first time this panel mounts without metrics.
  useEffect(() => {
    if (uid && !metricsLoaded) loadMetrics(uid);
  }, [uid, metricsLoaded, loadMetrics]);

  const assessment = buildFitnessAssessment(allLogs, profile, latestMetric?.weight, {
    logs: periodLogs,
    prevLogs: prevPeriodLogs,
    label: periodLabel,
    days: periodDays,
    prevDays: prevPeriodDays,
    start: periodStart,
    end: periodEnd,
  });

  if (!assessment) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-black text-text-main">📊 Đánh giá thể lực</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-primary bg-primary-light border border-primary/20 rounded-full px-2.5 py-0.5">
            Chỉ số thể lực {assessment.score}/100
          </span>
          <span className="text-sm font-black text-text-main">
            {assessment.emoji} {assessment.level}
          </span>
        </div>
        <p className="text-[10px] text-text-secondary">
          Trọng số: {assessment.weights.map((w) => `${w.label} ${w.pct}%`).join(' · ')}
        </p>
        <p className="text-[10px] text-text-muted italic">{assessment.scopeNote}</p>
      </div>

      {assessment.needsProfile && (
        <Link
          to="/settings"
          className="block text-xs font-bold text-primary bg-primary-light border border-primary/20 rounded-2xl px-3 py-2"
        >
          Nhập giới tính, năm sinh, chiều cao để chấm theo chuẩn →
        </Link>
      )}

      <div className="space-y-3">
        {assessment.dimensions.map((dim) => (
          <div key={dim.key} className="pt-3 border-t border-border first:border-t-0 first:pt-0 space-y-0.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-text-main">
                {dim.label} · <span className="font-normal text-text-secondary">{dim.valueText}</span>
              </span>
              <span className="text-[11px] font-bold text-primary bg-primary-light border border-primary/20 rounded-full px-2 py-0.5">
                {dim.tierLabel}
              </span>
            </div>
            <ScaleBarSafe dim={dim} />
            {dim.nextText && <p className="text-xs text-text-secondary">{dim.nextText}</p>}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border space-y-1">
        <p className="text-xs font-bold text-text-main">Tuần này</p>
        <p className="text-sm text-text-main">{assessment.weekLine}</p>
      </div>

      <div className="pt-3 border-t border-border space-y-1">
        <p className="text-xs font-bold text-text-main">Tiêu điểm</p>
        <p className="text-sm font-bold text-text-main">{assessment.focus}</p>
      </div>

      <Link
        to="/settings/criteria"
        className="block pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
      >
        📚 Xem tiêu chí & nguồn tham khảo →
      </Link>
    </div>
  );
}

// Wrapper so a dimension with no bands (needsProfile / not-enough-data rows)
// simply renders nothing instead of crashing on empty band math.
function ScaleBarSafe({ dim }: { dim: AssessmentDimension }) {
  if (dim.bands.length === 0) return null;
  return <ScaleBarInner dim={dim} />;
}

function ScaleBarInner({ dim }: { dim: AssessmentDimension }) {
  // scaleMarkerPercent positions the marker WITHIN its own equal-width band
  // segment (proportional to the value's position between that band's
  // threshold and the next), rather than linearly across the whole
  // low..high range — the bands below are rendered as equal-width flex-1
  // segments, so unevenly-spaced thresholds (BMI, WHO) need this to line up.
  const markerPct = scaleMarkerPercent(dim.bands, dim.value);
  // Separate DISPLAY-only clamp so the dot never sits flush against the
  // rounded ends of the bar; the returned markerPct itself stays 0-100.
  const displayPct = Math.min(96, Math.max(4, markerPct));

  return (
    <div className="pt-1.5">
      <div className="relative h-2 rounded-full bg-border overflow-hidden flex">
        {dim.bands.map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 bg-primary/20 ${i > 0 ? 'border-l border-card' : ''}`}
            style={{ opacity: 0.25 + (i / Math.max(1, dim.bands.length - 1)) * 0.55 }}
          />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-card shadow"
          style={{ left: `${displayPct}%` }}
        />
      </div>
      <div className="flex mt-0.5">
        {dim.bands.map((b, i) => (
          <span key={i} className="text-[9px] text-text-secondary leading-none text-center" style={{ width: `${100 / dim.bands.length}%` }}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
