import { create } from "zustand";

/**
 * Global app theme. The app shell stays monochrome by design:
 * - "blink-light" — white/gray surfaces, black primary
 * - "blink-dark"  — near-black surfaces, white primary
 * - "system"      — follows prefers-color-scheme
 *
 * Expressive color lives in per-chat themes (see chatTheme.ts), which are
 * scoped to the chat container via data-theme and don't touch this store.
 */

export const BLINK_LIGHT = "blink-light";
export const BLINK_DARK = "blink-dark";

const STORAGE_KEY = "blink-theme";
const DEFAULT_THEME = "system";

export type AppTheme = "system" | typeof BLINK_LIGHT | typeof BLINK_DARK;

const DARK_THEMES = new Set<string>([BLINK_DARK]);

export function isDarkTheme(themeName: string): boolean {
  return DARK_THEMES.has(themeName);
}

export function resolveAppTheme(theme: AppTheme): string {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? BLINK_DARK : BLINK_LIGHT;
  }
  return theme;
}

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

function readStored(): AppTheme {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === BLINK_LIGHT || raw === BLINK_DARK || raw === "system" ? raw : DEFAULT_THEME;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStored(),
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const resolved = resolveAppTheme(state.theme);
      const next: AppTheme = resolved === BLINK_DARK ? BLINK_LIGHT : BLINK_DARK;
      localStorage.setItem(STORAGE_KEY, next);
      return { theme: next };
    });
  },
}));
