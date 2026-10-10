import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      // Legacy color aliases — all resolve to the active daisyUI theme so old
      // classes keep rendering (theme-aware) until components are migrated.
      // New code should use daisyUI tokens directly (bg-base-100, text-base-content, ...).
      colors: {
        primary: {
          DEFAULT: "oklch(var(--p) / <alpha-value>)",
          dark: "oklch(var(--p) / <alpha-value>)",
          foreground: "oklch(var(--pc) / <alpha-value>)",
          "high-contrast": "#000000",
        },
        surface: {
          DEFAULT: "oklch(var(--b1) / <alpha-value>)",
          dark: "oklch(var(--b1) / <alpha-value>)",
          "high-contrast": "#000000",
        },
        background: {
          DEFAULT: "oklch(var(--b1) / <alpha-value>)",
          dark: "oklch(var(--b1) / <alpha-value>)",
          "high-contrast": "#000000",
        },
        border: {
          DEFAULT: "oklch(var(--b3) / <alpha-value>)",
          dark: "oklch(var(--b3) / <alpha-value>)",
          "high-contrast": "#FFFFFF",
        },
        success: {
          DEFAULT: "oklch(var(--su) / <alpha-value>)",
          foreground: "oklch(var(--suc) / <alpha-value>)",
          "high-contrast": "#00FF00",
        },
        warning: {
          DEFAULT: "oklch(var(--wa) / <alpha-value>)",
          foreground: "oklch(var(--wac) / <alpha-value>)",
          "high-contrast": "#FFFF00",
        },
        danger: {
          DEFAULT: "oklch(var(--er) / <alpha-value>)",
          foreground: "oklch(var(--erc) / <alpha-value>)",
          "high-contrast": "#FF0000",
        },
        text: {
          DEFAULT: "oklch(var(--bc) / <alpha-value>)",
          dark: "oklch(var(--bc) / <alpha-value>)",
          "high-contrast": "#FFFFFF",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "blink-light": {
          primary: "#FF6A5C",
          "primary-content": "#FFFFFF",
          secondary: "#5B6472",
          accent: "#FF6A5C",
          neutral: "#2B3038",
          "base-100": "#FFFFFF",
          "base-200": "#EDF1F6",
          "base-300": "#DDE4EC",
          "base-content": "#2B3038",
          info: "#0EA5E9",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      {
        "blink-dark": {
          primary: "#FF7A6B",
          "primary-content": "#1A0B08",
          secondary: "#9AA3B2",
          accent: "#FF7A6B",
          neutral: "#0B0B0D",
          "base-100": "#000000",
          "base-200": "#0B0B0D",
          "base-300": "#1A1A1F",
          "base-content": "#F4F4F5",
          info: "#38BDF8",
          success: "#4ADE80",
          warning: "#FBBF24",
          error: "#F87171",
        },
      },
      // NOTE (v3): per-chat customization is accent-only now (see
      // src/lib/chatThemes.ts + .chat-accent-* in index.css). The old
      // full-theme picker entries were removed; unknown stored theme
      // names safely fall back to the app theme.
    ],
    darkTheme: "blink-dark",
    base: true,
    styled: true,
    utils: true,
  },
};
