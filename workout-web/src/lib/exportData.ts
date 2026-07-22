import { WorkoutLog } from '../types/workout';
import { BodyMetric } from '../types/body';
import { APP_VERSION } from '../constants/version';

function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const LOG_CSV_HEADERS = [
  'Ngày', 'Bài tập', 'Nhóm', 'Số hiệp', 'Số lần', 'Thời gian (giây)',
  'Tạ (kg)', 'Quãng đường (km)', 'Cường độ', 'Phút', 'Calo', 'Ghi chú',
];

// One row per exercise entry (not per log) — mirrors how logs display
// everywhere else in the app and keeps each row a single measurable set of
// numbers, easiest to pivot/filter once opened in a spreadsheet.
export function logsToCSV(logs: WorkoutLog[]): string {
  const rows = [LOG_CSV_HEADERS.join(',')];
  const sorted = [...logs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  for (const log of sorted) {
    for (const ex of log.exercises) {
      rows.push([
        csvEscape(log.date),
        csvEscape(ex.name),
        csvEscape(ex.category),
        csvEscape(ex.sets),
        csvEscape(ex.reps),
        csvEscape(ex.durationSeconds),
        csvEscape(ex.weight),
        csvEscape(ex.distance),
        csvEscape(log.intensity),
        csvEscape(log.totalDurationMinutes),
        csvEscape(log.caloriesEstimate),
        csvEscape(log.notes),
      ].join(','));
    }
  }
  return rows.join('\n');
}

export interface BackupPayload {
  exportedAt: string;
  appVersion: string;
  logs: Array<Pick<WorkoutLog, 'id' | 'date' | 'exercises' | 'totalDurationMinutes' | 'intensity' | 'intensityScore' | 'caloriesEstimate' | 'notes' | 'source'>>;
  bodyMetrics: Array<Pick<BodyMetric, 'id' | 'date' | 'weight' | 'chestCm' | 'hipCm' | 'armCm' | 'notes'>>;
}

// Full-fidelity JSON backup — everything needed to reconstruct a user's
// history, minus server-only fields (userId, Firestore Timestamps) that are
// either implicit (it's their own export) or not meaningful outside Firestore.
export function buildBackupPayload(logs: WorkoutLog[], bodyMetrics: BodyMetric[]): BackupPayload {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    logs: [...logs]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(({ id, date, exercises, totalDurationMinutes, intensity, intensityScore, caloriesEstimate, notes, source }) => ({
        id, date, exercises, totalDurationMinutes, intensity, intensityScore, caloriesEstimate, notes, source,
      })),
    bodyMetrics: [...bodyMetrics]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(({ id, date, weight, chestCm, hipCm, armCm, notes }) => ({ id, date, weight, chestCm, hipCm, armCm, notes })),
  };
}

// U+FEFF (UTF-8 BOM) makes Excel detect UTF-8 correctly — without it,
// Vietnamese diacritics in CSV exports render as mojibake when opened there.
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const withBom = mimeType.startsWith('text/csv') ? `\ufeff${content}` : content;
  const blob = new Blob([withBom], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
