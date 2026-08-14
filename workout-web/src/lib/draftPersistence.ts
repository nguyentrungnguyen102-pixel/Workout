import { DraftWorkout, ExerciseEntry, Intensity } from '../types/workout';

// Minimal storage shape so tests can inject an in-memory fake instead of
// needing a jsdom `localStorage` (this project's test env is plain Node,
// like every other lib/*.test.ts here).
export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DRAFT_STORAGE_KEY = 'workoutDraft';

// An in-progress workout left untouched this long is treated as abandoned,
// not resumed — otherwise a draft from a session the user gave up on days
// ago could silently reappear and get logged with a stale start time.
export const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;

function defaultStorage(): DraftStorage {
  if (typeof localStorage === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
}

function isValidIntensity(value: unknown): value is Intensity {
  return value === 'light' || value === 'moderate' || value === 'heavy';
}

function isValidExerciseEntry(value: unknown): value is ExerciseEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return typeof e.presetId === 'string' && typeof e.name === 'string' && typeof e.sets === 'number';
}

export function serializeDraft(draft: DraftWorkout): string {
  return JSON.stringify(draft);
}

// Parses raw persisted JSON back into a DraftWorkout, or null if it's
// missing, corrupt, empty, or too old to resume (see MAX_DRAFT_AGE_MS).
export function parseDraft(raw: string, now: Date = new Date()): DraftWorkout | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.exercises) || p.exercises.length === 0) return null;
  if (!p.exercises.every(isValidExerciseEntry)) return null;

  let startedAt: Date | null = null;
  if (typeof p.startedAt === 'string') {
    const parsedDate = new Date(p.startedAt);
    if (isNaN(parsedDate.getTime())) return null;
    if (now.getTime() - parsedDate.getTime() > MAX_DRAFT_AGE_MS) return null;
    startedAt = parsedDate;
  }

  return {
    exercises: p.exercises,
    startedAt,
    intensity: isValidIntensity(p.intensity) ? p.intensity : 'moderate',
    notes: typeof p.notes === 'string' ? p.notes : '',
    location: typeof p.location === 'string' ? p.location : '',
  };
}

export function loadPersistedDraft(storage: DraftStorage = defaultStorage(), now: Date = new Date()): DraftWorkout | null {
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  const draft = parseDraft(raw, now);
  if (!draft) storage.removeItem(DRAFT_STORAGE_KEY);
  return draft;
}

// A draft with no exercises yet is not worth resuming — store nothing
// (and clear anything stale) rather than persist an empty shell.
export function savePersistedDraft(draft: DraftWorkout, storage: DraftStorage = defaultStorage()): void {
  if (draft.exercises.length === 0) {
    storage.removeItem(DRAFT_STORAGE_KEY);
    return;
  }
  storage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft));
}

export function clearPersistedDraft(storage: DraftStorage = defaultStorage()): void {
  storage.removeItem(DRAFT_STORAGE_KEY);
}
