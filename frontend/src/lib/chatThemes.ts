/**
 * Curated per-chat themes. A hand-picked subset of daisyUI themes —
 * restrained monochromes plus expressive IG-energy picks that actually
 * hold together. Only these ship in the picker (the full daisyUI set
 * stays out on purpose).
 *
 * `dark: true` marks themes with a dark base — used to keep status text
 * readable inside themed containers.
 */

export interface ChatTheme {
  name: string;
  label: string;
  group: "mono" | "expressive";
  dark: boolean;
}

export const CHAT_THEMES: ChatTheme[] = [
  // Restrained
  { name: "lofi", label: "Paper", group: "mono", dark: false },
  { name: "wireframe", label: "Wire", group: "mono", dark: false },
  { name: "nord", label: "Nord", group: "mono", dark: false },
  { name: "black", label: "Blackout", group: "mono", dark: true },
  { name: "luxury", label: "Lux", group: "mono", dark: true },
  { name: "business", label: "Slate", group: "mono", dark: true },
  // Expressive
  { name: "cupcake", label: "Cupcake", group: "expressive", dark: false },
  { name: "retro", label: "Retro", group: "expressive", dark: false },
  { name: "valentine", label: "Bloom", group: "expressive", dark: false },
  { name: "aqua", label: "Lagoon", group: "expressive", dark: true },
  { name: "coffee", label: "Espresso", group: "expressive", dark: true },
  { name: "forest", label: "Moss", group: "expressive", dark: true },
  { name: "sunset", label: "Sunset", group: "expressive", dark: true },
  { name: "dracula", label: "Grape", group: "expressive", dark: true },
];

export const MONO_THEMES = CHAT_THEMES.filter((t) => t.group === "mono");
export const EXPRESSIVE_THEMES = CHAT_THEMES.filter((t) => t.group === "expressive");

export function isKnownChatTheme(name: string | null | undefined): boolean {
  return !!name && CHAT_THEMES.some((t) => t.name === name);
}
