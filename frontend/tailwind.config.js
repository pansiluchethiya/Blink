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
          primary: "#000000",
          secondary: "#525252",
          accent: "#a3a3a3",
          neutral: "#171717",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e5e5e5",
          info: "#2563eb",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
        },
      },
      {
        "blink-dark": {
          primary: "#ffffff",
          secondary: "#a3a3a3",
          accent: "#737373",
          neutral: "#0a0a0a",
          "base-100": "#0a0a0a",
          "base-200": "#141414",
          "base-300": "#222222",
          info: "#60a5fa",
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
      // Curated per-chat themes: restrained half + expressive half.
      "black",
      "lofi",
      "luxury",
      "wireframe",
      "nord",
      "business",
      "sunset",
      "dracula",
      "valentine",
      "aqua",
      "retro",
      "coffee",
      "forest",
      "cupcake",
    ],
    darkTheme: "blink-dark",
    base: true,
    styled: true,
    utils: true,
  },
};
