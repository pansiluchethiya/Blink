import { useThemeStore, resolveAppTheme, BLINK_DARK } from "../store/useThemeStore";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = resolveAppTheme(theme) === BLINK_DARK;

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-circle btn-ghost btn-sm"
      title={`Switch theme (Current: ${theme})`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
