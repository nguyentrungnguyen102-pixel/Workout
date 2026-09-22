import { create } from 'zustand';
import {
  Theme,
  ResolvedTheme,
  getStoredTheme,
  storeTheme,
  resolveTheme,
  systemPrefersDark,
  applyResolvedTheme,
} from '../lib/theme';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  init: () => void;
  setTheme: (theme: Theme) => void;
}

let systemListenerAttached = false;

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  // Called once at startup (main.tsx) — reads the stored preference, applies
  // it to <html> (redundant with index.html's inline script, which only
  // covers first paint) and starts listening for OS theme changes so a
  // 'system' preference stays live without a page reload.
  init: () => {
    const theme = getStoredTheme();
    const resolvedTheme = resolveTheme(theme, systemPrefersDark());
    applyResolvedTheme(resolvedTheme);
    set({ theme, resolvedTheme });

    if (!systemListenerAttached && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      systemListenerAttached = true;
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', (e) => {
        if (get().theme !== 'system') return;
        const next = resolveTheme('system', e.matches);
        applyResolvedTheme(next);
        set({ resolvedTheme: next });
      });
    }
  },

  setTheme: (theme) => {
    storeTheme(theme);
    const resolvedTheme = resolveTheme(theme, systemPrefersDark());
    applyResolvedTheme(resolvedTheme);
    set({ theme, resolvedTheme });
  },
}));
