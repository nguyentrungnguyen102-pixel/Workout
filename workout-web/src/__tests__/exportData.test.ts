import { describe, it, expect } from 'vitest';
import { logsToCSV, buildBackupPayload } from '../lib/exportData';
import { WorkoutLog } from '../types/workout';
import { BodyMetric } from '../types/body';

function makeLog(id: string, date: string, overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id,
    userId: 'test-user',
    date,
    exercises: [
      { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 },
    ],
    totalDurationMinutes: 10,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 50,
    source: 'manual',
    syncedToSheets: false,
    ...overrides,
  } as WorkoutLog;
}

function makeMetric(id: string, date: string, overrides: Partial<BodyMetric> = {}): BodyMetric {
  return { id, userId: 'test-user', date, weight: 70, ...overrides };
}

describe('logsToCSV', () => {
  it('emits one row per exercise entry with a header row', () => {
    const log = makeLog('l1', '2026-07-10', {
      exercises: [
        { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 },
        { presetId: 'plank', name: 'Plank', category: 'core', unit: 'seconds', sets: 3, durationSeconds: 60 },
      ],
    });
    const csv = logsToCSV([log]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 exercise rows
    expect(lines[0]).toContain('Ngày');
    expect(lines[1]).toContain('Hít đất');
    expect(lines[1]).toContain('2026-07-10');
    expect(lines[2]).toContain('Plank');
  });

  it('sorts rows chronologically regardless of input order', () => {
    const csv = logsToCSV([makeLog('l2', '2026-07-15'), makeLog('l1', '2026-07-01')]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('2026-07-01');
    expect(lines[2]).toContain('2026-07-15');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const log = makeLog('l1', '2026-07-10', { notes: 'Tốt, nhưng hơi mệt "quá sức"' });
    const csv = logsToCSV([log]);
    expect(csv).toContain('"Tốt, nhưng hơi mệt ""quá sức"""');
  });

  it('renders undefined numeric fields as empty rather than the string "undefined"', () => {
    const csv = logsToCSV([makeLog('l1', '2026-07-10')]);
    expect(csv).not.toContain('undefined');
  });

  it('returns just the header for an empty log list', () => {
    const csv = logsToCSV([]);
    expect(csv.split('\n')).toHaveLength(1);
  });
});

describe('buildBackupPayload', () => {
  it('includes exportedAt/appVersion metadata plus sorted logs and body metrics', () => {
    const payload = buildBackupPayload(
      [makeLog('l2', '2026-07-15'), makeLog('l1', '2026-07-01')],
      [makeMetric('m1', '2026-07-01')]
    );
    expect(payload.exportedAt).toBeTruthy();
    expect(payload.appVersion).toBeTruthy();
    expect(payload.logs.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(payload.bodyMetrics).toHaveLength(1);
  });

  it('omits server-only fields (userId, syncedToSheets) from exported logs', () => {
    const payload = buildBackupPayload([makeLog('l1', '2026-07-10')], []);
    expect(payload.logs[0]).not.toHaveProperty('userId');
    expect(payload.logs[0]).not.toHaveProperty('syncedToSheets');
  });

  it('round-trips through JSON.stringify/parse without losing exercise data', () => {
    const payload = buildBackupPayload([makeLog('l1', '2026-07-10')], []);
    const parsed = JSON.parse(JSON.stringify(payload));
    expect(parsed.logs[0].exercises).toEqual(payload.logs[0].exercises);
  });
});
