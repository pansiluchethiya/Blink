import React, { useEffect } from "react";
import { useThemeStore, resolveAppTheme, isDarkTheme } from "../store/useThemeStore";

/**
 * ThemeProvider is the single place that syncs the global app theme to <html>.
 * - Sets data-theme to the resolved daisyUI theme (blink-light / blink-dark).
 * - Toggles the .dark class so existing `dark:` Tailwind variants keep working.
 * - Listens to OS changes while theme is "system".
 *
 * Per-chat themes are applied separately on the chat container (data-theme
 * scoped to that subtree) and never touch the root element.
 */
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolved = resolveAppTheme(theme);
      root.setAttribute("data-theme", resolved);
      root.classList.toggle("dark", isDarkTheme(resolved));
    };
    applyTheme();
    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
