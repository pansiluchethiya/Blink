import { useEffect, useState } from "react";
import { Lock, Clock3, X } from "lucide-react";

const expirationOptions = [
  { label: "Off", value: "off" },
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
  { label: "90 Days", value: "90d" },
];

const buildExpiry = (value) => {
  const now = new Date();
  if (value === "24h") now.setHours(now.getHours() + 24);
  if (value === "7d") now.setDate(now.getDate() + 7);
  if (value === "90d") now.setDate(now.getDate() + 90);
  return now;
};

const ChatPrivacyMenu = ({
  open,
  onClose,
  selectedUser,
  chatSettings,
  isLocked,
  onSetChatExpiry,
  onLockChat,
  onUnlockChat,
}) => {
  const [expiryOption, setExpiryOption] = useState("off");
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(isLocked);
  const [statusMessage, setStatusMessage] = useState("");
  useEffect(() => {
    setLocked(isLocked);
    if (selectedUser) {
      const settings = chatSettings[selectedUser._id];
      if (settings?.expiryLabel) {
        setExpiryOption(settings.expiryLabel);
      }
    }
  }, [selectedUser, chatSettings, isLocked]);

  useEffect(() => {
    if (!open || !selectedUser) return;
    const handleClose = () => onClose();
    window.addEventListener("close-active-modal", handleClose);
    return () => {
      window.removeEventListener("close-active-modal", handleClose);
    };
  }, [open, selectedUser, onClose]);

  const handleSaveExpiry = async () => {
    if (!selectedUser) return;
    const expiresAt = expiryOption === "off" ? null : buildExpiry(expiryOption);
    await onSetChatExpiry(selectedUser._id, expiryOption, expiresAt);
    setStatusMessage("Disappearing messages updated.");
  };

  const handleLock = async () => {
    if (!selectedUser) return;
    if (!pin || pin.length < 4) {
      setStatusMessage("PIN must be at least 4 digits.");
      return;
    }
    await onLockChat(selectedUser._id, pin);
    setLocked(true);
    setStatusMessage("Chat locked successfully.");
  };

  const handleUnlock = async () => {
    if (!selectedUser) return;
    const ok = await onUnlockChat(selectedUser._id, pin);
    if (ok) {
      setLocked(false);
      setStatusMessage("Chat unlocked.");
    }
  };

  if (!open || !selectedUser) return null;

  return (
    <div 
      data-context="modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-200/60 backdrop-blur-sm sm:p-4 transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-base-100 shadow-2xl sm:rounded-3xl border-t sm:border border-base-300 overflow-hidden animate-fadeIn mobile-bottom-sheet h-fit max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile drag (aesthetic) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-1.5 bg-base-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-base-content/60">Privacy Settings</p>
            <h2 className="text-lg font-bold text-base-content truncate max-w-[200px]">{selectedUser.fullName || selectedUser.name}</h2>
          </div>
          <button 
            className="size-8 flex items-center justify-center bg-base-200 text-base-content/60 rounded-full hover:bg-base-200 transition-colors" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
          {/* Disappearing Messages Section */}
          <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock3 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base-content text-sm">Disappearing messages</h3>
                <p className="text-[11px] text-base-content/60 font-medium">Auto-delete messages after a period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {expirationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setExpiryOption(option.value)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 ${
                    expiryOption === option.value 
                      ? "border-primary bg-primary text-base-content shadow-md shadow-primary/10" 
                      : "border-base-300 bg-base-100 text-base-content/60 hover:border-base-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={handleSaveExpiry}
              className="mt-4 w-full py-2.5 bg-base-200 hover:bg-primary hover:text-base-content text-base-content/60 rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
            >
              Update Preference
            </button>
          </div>

          {/* Chat Lock Section */}
          <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base-content text-sm">Chat Lock</h3>
                <p className="text-[11px] text-base-content/60 font-medium">Protect this chat with a secret PIN</p>
              </div>
            </div>
            
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm mb-3"
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={locked ? handleUnlock : handleLock}
                className="flex-[2] py-2.5 bg-primary hover:bg-primary text-base-content rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-md shadow-primary/10"
              >
                {locked ? "Unlock Conversation" : "Lock Conversation"}
              </button>
              <button
                type="button"
                onClick={() => setPin("")}
                className="flex-1 py-2.5 bg-base-200 text-base-content/60 rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
              >
                Clear
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary text-center animate-fadeIn">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPrivacyMenu;
