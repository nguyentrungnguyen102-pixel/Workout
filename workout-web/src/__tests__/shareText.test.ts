import { describe, it, expect } from 'vitest';
import { buildLogShareText } from '../lib/shareText';
import { WorkoutLog } from '../types/workout';

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'l1',
    userId: 'test-user',
    date: '2026-07-10',
    exercises: [
      { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 },
    ],
    totalDurationMinutes: 25,
    intensityScore: 5,
    intensity: 'moderate',
    caloriesEstimate: 180,
    source: 'manual',
    syncedToSheets: false,
    ...overrides,
  } as WorkoutLog;
}

describe('buildLogShareText', () => {
  it('includes the date label, duration and calories', () => {
    const text = buildLogShareText(makeLog(), 'Thứ Sáu, 10/07/2026');
    expect(text).toContain('Thứ Sáu, 10/07/2026');
    expect(text).toContain('25 phút');
    expect(text).toContain('180 kcal');
  });

  it('lists every exercise with its formatted amount', () => {
    const log = makeLog({
      exercises: [
        { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 },
        { presetId: 'plank', name: 'Plank', category: 'core', unit: 'seconds', sets: 3, durationSeconds: 60 },
      ],
    });
    const text = buildLogShareText(log, '10/07/2026');
    expect(text).toContain('• Hít đất: 20 cái');
    expect(text).toContain('• Plank: 60 giây');
  });

  it('includes location and notes only when present', () => {
    const withBoth = buildLogShareText(makeLog({ location: 'Sân Q7', notes: 'Mệt nhưng vui' }), '10/07/2026');
    expect(withBoth).toContain('📍 Sân Q7');
    expect(withBoth).toContain('📝 Mệt nhưng vui');

    const withNeither = buildLogShareText(makeLog(), '10/07/2026');
    expect(withNeither).not.toContain('📍');
    expect(withNeither).not.toContain('📝');
  });

  it('ends with the app footer', () => {
    const text = buildLogShareText(makeLog(), '10/07/2026');
    expect(text.trim().endsWith('— WorkoutTracker')).toBe(true);
  });

  it('renders a distance-based exercise with km unit', () => {
    const log = makeLog({
      exercises: [{ presetId: 'running', name: 'Chạy bộ', category: 'cardio', unit: 'km', sets: 1, distance: 5 }],
    });
    const text = buildLogShareText(log, '10/07/2026');
    expect(text).toContain('• Chạy bộ: 5 km');
  });
});
