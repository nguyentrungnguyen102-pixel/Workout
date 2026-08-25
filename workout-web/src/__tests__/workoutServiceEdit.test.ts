import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExerciseEntry } from '../types/workout';

const updateDocMock = vi.fn().mockResolvedValue(undefined);
const deleteDocMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ __collection: name })),
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ __doc: path.join('/') })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  increment: vi.fn((n: number) => n),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  Timestamp: { fromDate: vi.fn() },
}));

// Imported after the mocks above so workoutService picks up the mocked deps.
const { updateLog, deleteLog } = await import('../services/workoutService');

function makeExercise(overrides: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    presetId: 'pushup',
    name: 'Hít đất',
    category: 'strength',
    unit: 'reps',
    sets: 3,
    reps: 20,
    ...overrides,
  };
}

describe('updateLog', () => {
  beforeEach(() => {
    updateDocMock.mockClear();
    deleteDocMock.mockClear();
  });

  it('throws and never writes when the edit has no exercises left', async () => {
    await expect(updateLog('log1', { exercises: [], notes: '', location: '' })).rejects.toThrow();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('recomputes duration/intensity/calories and writes sanitized exercises', async () => {
    await updateLog(
      'log1',
      { exercises: [makeExercise({ reps: 30, sets: 4 })], notes: 'cảm thấy khoẻ', location: 'Nhà' },
      70
    );

    expect(updateDocMock).toHaveBeenCalledTimes(1);
    const [, payload] = updateDocMock.mock.calls[0];
    expect(payload.exercises).toEqual([
      { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 4, reps: 30 },
    ]);
    expect(payload.notes).toBe('cảm thấy khoẻ');
    expect(payload.location).toBe('Nhà');
    expect(payload.totalDurationMinutes).toBeGreaterThan(0);
    expect(payload.caloriesEstimate).toBeGreaterThan(0);
    expect(payload.intensity).toBe('light'); // single exercise, 4 sets total (< 6) -> light
  });

  it('omits undefined optional fields (weight/distance/durationSeconds) from the write', async () => {
    await updateLog('log1', { exercises: [makeExercise()], notes: '', location: '' });
    const [, payload] = updateDocMock.mock.calls[0];
    expect(payload.exercises[0]).not.toHaveProperty('weight');
    expect(payload.exercises[0]).not.toHaveProperty('distance');
    expect(payload.exercises[0]).not.toHaveProperty('durationSeconds');
  });
});

describe('deleteLog', () => {
  it('deletes the log document by id', async () => {
    await deleteLog('log42');
    expect(deleteDocMock).toHaveBeenCalledTimes(1);
    expect(deleteDocMock.mock.calls[0][0]).toEqual({ __doc: 'logs/log42' });
  });
});
