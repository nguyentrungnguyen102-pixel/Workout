import { describe, it, expect } from 'vitest';
import {
  DRAFT_STORAGE_KEY,
  DraftStorage,
  parseDraft,
  loadPersistedDraft,
  savePersistedDraft,
  clearPersistedDraft,
  serializeDraft,
} from '../lib/draftPersistence';
import { DraftWorkout, ExerciseEntry } from '../types/workout';

function memoryStorage(initial: Record<string, string> = {}): DraftStorage {
  const store = { ...initial };
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
  };
}

const pushup: ExerciseEntry = { presetId: 'pushup', name: 'Hít đất', category: 'strength', unit: 'reps', sets: 3, reps: 20 };

const draft: DraftWorkout = {
  exercises: [pushup],
  startedAt: new Date('2026-08-14T07:00:00'),
  intensity: 'heavy',
  notes: 'tập ở nhà',
  location: 'Nhà',
};

describe('parseDraft', () => {
  it('round-trips a valid serialized draft', () => {
    const now = new Date('2026-08-14T08:00:00');
    expect(parseDraft(serializeDraft(draft), now)).toEqual(draft);
  });

  it('returns null for invalid JSON', () => {
    expect(parseDraft('not json')).toBeNull();
  });

  it('returns null when exercises is missing or empty', () => {
    expect(parseDraft(JSON.stringify({ ...draft, exercises: [] }))).toBeNull();
    expect(parseDraft(JSON.stringify({ notes: '' }))).toBeNull();
  });

  it('returns null when an exercise entry is malformed', () => {
    expect(parseDraft(JSON.stringify({ ...draft, exercises: [{ name: 'no presetId' }] }))).toBeNull();
  });

  it('drops a draft older than 24h instead of resuming it', () => {
    const now = new Date(draft.startedAt!.getTime() + 25 * 60 * 60 * 1000);
    expect(parseDraft(serializeDraft(draft), now)).toBeNull();
  });

  it('keeps a draft just under the 24h cutoff', () => {
    const now = new Date(draft.startedAt!.getTime() + 23 * 60 * 60 * 1000);
    expect(parseDraft(serializeDraft(draft), now)).not.toBeNull();
  });

  it('falls back to defaults for missing intensity/notes/location', () => {
    const raw = JSON.stringify({ exercises: [pushup], startedAt: null });
    expect(parseDraft(raw)).toEqual({
      exercises: [pushup],
      startedAt: null,
      intensity: 'moderate',
      notes: '',
      location: '',
    });
  });

  it('rejects an unparseable startedAt instead of resuming with a garbage date', () => {
    expect(parseDraft(JSON.stringify({ ...draft, startedAt: 'not-a-date' }))).toBeNull();
  });
});

describe('loadPersistedDraft / savePersistedDraft / clearPersistedDraft', () => {
  it('returns null when nothing is stored', () => {
    expect(loadPersistedDraft(memoryStorage())).toBeNull();
  });

  it('saves a non-empty draft and loads it back', () => {
    const storage = memoryStorage();
    savePersistedDraft(draft, storage);
    expect(loadPersistedDraft(storage, new Date('2026-08-14T08:00:00'))).toEqual(draft);
  });

  it('removes the stored key instead of writing an empty draft', () => {
    const storage = memoryStorage({ [DRAFT_STORAGE_KEY]: serializeDraft(draft) });
    savePersistedDraft({ exercises: [], startedAt: null, intensity: 'moderate', notes: '', location: '' }, storage);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears whatever is stored', () => {
    const storage = memoryStorage({ [DRAFT_STORAGE_KEY]: serializeDraft(draft) });
    clearPersistedDraft(storage);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('self-heals by clearing a corrupt stored value on load', () => {
    const storage = memoryStorage({ [DRAFT_STORAGE_KEY]: '{broken' });
    expect(loadPersistedDraft(storage)).toBeNull();
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
