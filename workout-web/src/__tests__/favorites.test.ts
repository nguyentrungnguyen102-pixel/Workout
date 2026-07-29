import { describe, it, expect } from 'vitest';
import { toggleFavorite, sortWithFavoritesFirst } from '../lib/favorites';

describe('toggleFavorite', () => {
  it('adds an id that is not yet favorited', () => {
    expect(toggleFavorite([], 'pushup')).toEqual(['pushup']);
    expect(toggleFavorite(['squat'], 'pushup')).toEqual(['squat', 'pushup']);
  });

  it('removes an id that is already favorited', () => {
    expect(toggleFavorite(['squat', 'pushup'], 'pushup')).toEqual(['squat']);
  });

  it('treats undefined as an empty list', () => {
    expect(toggleFavorite(undefined, 'pushup')).toEqual(['pushup']);
  });

  it('does not mutate the input array', () => {
    const original = ['squat'];
    toggleFavorite(original, 'pushup');
    expect(original).toEqual(['squat']);
  });
});

describe('sortWithFavoritesFirst', () => {
  const items = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D' },
  ];

  it('returns the same array reference when there are no favorites', () => {
    expect(sortWithFavoritesFirst(items, undefined)).toBe(items);
    expect(sortWithFavoritesFirst(items, [])).toBe(items);
  });

  it('returns the same array reference when no favorite id matches any item', () => {
    expect(sortWithFavoritesFirst(items, ['zzz'])).toBe(items);
  });

  it('moves favorited items to the front, preserving relative order within each group', () => {
    expect(sortWithFavoritesFirst(items, ['c', 'a'])).toEqual([
      { id: 'a', label: 'A' },
      { id: 'c', label: 'C' },
      { id: 'b', label: 'B' },
      { id: 'd', label: 'D' },
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = [...items];
    sortWithFavoritesFirst(items, ['d']);
    expect(items).toEqual(copy);
  });
});
