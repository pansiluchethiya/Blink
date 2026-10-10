/**
 * v3 per-chat accents. Instead of full daisyUI themes (which fought the
 * app-level white/black themes), a chat can override just its accent color.
 * Applied as a `.chat-accent-<name>` class on the chat subtree, which
 * redefines `--p`/`--pc` — every `bg-primary`/`text-primary` element
 * (send button, unread pills, selected states, own bubbles) follows.
 *
 * Works in both app themes; stored via the existing
 * `chatSettings["theme:<chatKey>"]` slot, so no migration needed.
 * Unknown/legacy values fall back to Default (no class).
 */

export interface ChatAccent {
  name: string;
  label: string;
  /** Hex swatch for the picker. */
  hex: string;
}

export const DEFAULT_ACCENT = "coral";

export const CHAT_ACCENTS: ChatAccent[] = [
  { name: "coral", label: "Coral", hex: "#FF6A5C" },
  { name: "sky", label: "Sky", hex: "#0EA5E9" },
  { name: "violet", label: "Violet", hex: "#8B5CF6" },
  { name: "emerald", label: "Emerald", hex: "#10B981" },
  { name: "amber", label: "Amber", hex: "#F59E0B" },
  { name: "pink", label: "Pink", hex: "#EC4899" },
  { name: "slate", label: "Slate", hex: "#64748B" },
];

/** Legacy full-theme names from the v2 picker — treated as Default. */
const LEGACY_THEMES = new Set([
  "black", "lofi", "luxury", "wireframe", "nord", "business",
  "sunset", "dracula", "valentine", "aqua", "retro", "coffee",
  "forest", "cupcake",
]);

export function isKnownChatTheme(name: string | null | undefined): boolean {
  return !!name && (name === DEFAULT_ACCENT || CHAT_ACCENTS.some((a) => a.name === name));
}

export function isLegacyChatTheme(name: string | null | undefined): boolean {
  return !!name && LEGACY_THEMES.has(name);
}

/** CSS class to apply on the chat subtree, or "" for Default. */
export function chatAccentClass(name: string | null | undefined): string {
  if (!name || name === DEFAULT_ACCENT) return "";
  return CHAT_ACCENTS.some((a) => a.name === name) ? `chat-accent-${name}` : "";
}

// Back-compat alias: the v2 picker exported CHAT_THEMES.
export { CHAT_ACCENTS as CHAT_THEMES };
export type { ChatAccent as ChatTheme };
