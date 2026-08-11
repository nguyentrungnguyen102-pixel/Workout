// Dark mode — standard in top-downloaded fitness apps (Strava, Nike
// Training Club, Hevy). 3-way preference (light/dark/system) persisted to
// localStorage; resolution to an actual light/dark value is a pure
// function so it's unit-testable without a DOM. DOM/localStorage/matchMedia
// access lives in the thin wrapper functions below and in
// stores/themeStore.ts, never in the pure logic itself.

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

export function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (VALID_THEMES as string[]).includes(value);
}

// Pure — the only piece of this module worth unit testing directly.
export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

export function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system';
  const raw = localStorage.getItem(STORAGE_KEY);
  return isValidTheme(raw) ? raw : 'system';
}

export function storeTheme(theme: Theme): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

// Toggles the `dark` class Tailwind's darkMode:'class' strategy + the CSS
// vars in index.css look for on <html>.
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}
