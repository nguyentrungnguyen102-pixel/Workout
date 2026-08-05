// Favorite/pin exercises — standard in top-downloaded workout apps (Strong,
// Hevy, Nike Training Club) so frequently-used exercises surface faster than
// scrolling/searching every time.

export function toggleFavorite(ids: string[] | undefined, id: string): string[] {
  const current = ids || [];
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
}

// Stable partition: favorites first (in their original relative order),
// then everything else (also in original relative order). No-op (returns
// the same array reference) when there are no favorites, so callers can
// call this unconditionally without extra allocation on the common path.
export function sortWithFavoritesFirst<T extends { id: string }>(
  items: T[],
  favoriteIds: string[] | undefined
): T[] {
  if (!favoriteIds || favoriteIds.length === 0) return items;
  const favSet = new Set(favoriteIds);
  const favs: T[] = [];
  const rest: T[] = [];
  items.forEach((item) => (favSet.has(item.id) ? favs : rest).push(item));
  if (favs.length === 0) return items;
  return [...favs, ...rest];
}
