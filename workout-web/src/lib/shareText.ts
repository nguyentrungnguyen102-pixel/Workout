import { WorkoutLog } from '../types/workout';
import { formatAmount } from './format';

// Plain-text summary for navigator.share()/clipboard — kept as a pure
// function (no DOM/Web Share API calls) so it's unit-testable without
// mocking browser APIs; callers pass in an already-localized date label
// since date formatting differs slightly by page (LogDetailPage includes
// the weekday, others may not).
export function buildLogShareText(log: WorkoutLog, dateLabel: string): string {
  const lines = [`💪 Buổi tập ${dateLabel}`, `⏱ ${log.totalDurationMinutes} phút · 🔥 ${log.caloriesEstimate} kcal`];
  for (const ex of log.exercises) {
    lines.push(`• ${ex.name}: ${formatAmount(ex)}`);
  }
  if (log.location) lines.push(`📍 ${log.location}`);
  if (log.notes) lines.push(`📝 ${log.notes}`);
  lines.push('— WorkoutTracker');
  return lines.join('\n');
}
