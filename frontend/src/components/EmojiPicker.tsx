import { EMOJIS } from "../constants";

const EmojiPicker = ({ onSelect, onClose }) => {
  return (
    <div className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-0 z-[60] bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-3 w-64 animate-fadeIn">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">Quick Emojis</span>
        <button onClick={onClose} className="text-base-content/60 hover:text-base-content/60">
          <span className="text-lg">×</span>
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji.name}
            onClick={() => { onSelect(emoji.char); onClose(); }}
            className="size-9 flex items-center justify-center rounded-xl hover:bg-base-200 transition-colors text-xl active:scale-90"
            title={emoji.name}
          >
            {emoji.char}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
