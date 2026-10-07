import React from "react";
import { Check } from "lucide-react";
import { CHAT_THEMES, MONO_THEMES, EXPRESSIVE_THEMES, type ChatTheme } from "../lib/chatThemes";
import Avatar from "./Avatar";

interface ChatThemePickerProps {
  peerName: string;
  peerSeed: string;
  current: string | null;
  onSelect: (themeName: string | null) => void;
}

/** Live miniature mock of a conversation, rendered inside the candidate theme. */
const ThemePreview: React.FC<{ theme: ChatTheme; peerName: string; peerSeed: string; selected: boolean }> = ({
  theme,
  peerName,
  peerSeed,
  selected,
}) => (
  <div
    data-theme={theme.name}
    className={`rounded-2xl overflow-hidden border-2 transition-all bg-base-100 ${
      selected ? "border-primary shadow-lg" : "border-base-300 hover:border-base-content/30"
    }`}
  >
    <div className="flex items-center gap-2 px-3 py-2 bg-base-200">
      <Avatar seed={peerSeed} name={peerName} className="size-6" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-base-content truncate leading-tight">{peerName}</p>
        <p className="text-[10px] text-base-content/50 leading-tight">Active now</p>
      </div>
      {selected && (
        <span className="ml-auto bg-primary text-primary-content rounded-full p-0.5">
          <Check size={12} />
        </span>
      )}
    </div>
    <div className="px-3 py-2.5 space-y-1.5">
      <div className="chat chat-start !gap-1">
        <div className="chat-bubble chat-bubble-sm !py-1.5 !px-2.5 text-xs">Hey, check this out</div>
      </div>
      <div className="chat chat-end !gap-1">
        <div className="chat-bubble chat-bubble-primary chat-bubble-sm !py-1.5 !px-2.5 text-xs">Whoa, looks great</div>
      </div>
      <div className="flex items-center gap-1.5 bg-base-200 rounded-full pl-3 pr-1.5 py-1">
        <span className="text-[11px] text-base-content/40 flex-1">Message…</span>
        <span className="bg-primary text-primary-content rounded-full px-2 py-0.5 text-[11px] font-bold">Send</span>
      </div>
    </div>
    <p className="text-center text-xs font-bold text-base-content pb-2">{theme.label}</p>
  </div>
);

const ChatThemePicker: React.FC<ChatThemePickerProps> = ({ peerName, peerSeed, current, onSelect }) => (
  <div className="space-y-5">
    <button
      type="button"
      onClick={() => onSelect(null)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
        !current ? "border-primary bg-primary/5" : "border-base-300 hover:border-base-content/30"
      }`}
    >
      <div className="flex -space-x-1.5">
        <span className="size-7 rounded-full bg-white border border-base-300" />
        <span className="size-7 rounded-full bg-black border border-base-300" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-base-content">Default</p>
        <p className="text-xs text-base-content/50">Follow your app theme</p>
      </div>
      {!current && <Check size={18} className="text-primary" />}
    </button>

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2 px-1">Mono</p>
      <div className="grid grid-cols-2 gap-2.5">
        {MONO_THEMES.map((t) => (
          <button key={t.name} type="button" onClick={() => onSelect(t.name)} className="text-left">
            <ThemePreview theme={t} peerName={peerName} peerSeed={peerSeed} selected={current === t.name} />
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2 px-1">Expressive</p>
      <div className="grid grid-cols-2 gap-2.5">
        {EXPRESSIVE_THEMES.map((t) => (
          <button key={t.name} type="button" onClick={() => onSelect(t.name)} className="text-left">
            <ThemePreview theme={t} peerName={peerName} peerSeed={peerSeed} selected={current === t.name} />
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default ChatThemePicker;
export { CHAT_THEMES };
