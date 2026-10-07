import { useEffect, useState } from "react";
import ChatLockModal from "./ChatLockModal";
import { Shield, ShieldCheck } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const LockedChatsPanel = ({ onSelectUser }) => {
  const { lockedChats, getLockedChats, unlockChat } = useChatStore();
  const [activeChat, setActiveChat] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getLockedChats();
  }, [getLockedChats]);

  const handleOpenLockedChat = (chat) => {
    setActiveChat(chat);
    setShowModal(true);
  };

  const handleUnlockSubmit = async (chat, pin) => {
    const success = await unlockChat(chat._id, pin);
    if (success) {
      setShowModal(false);
      onSelectUser(chat);
    }
  };

  return (
    <div className="border-b border-base-300 px-4 py-3 transition-colors duration-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-base-content">
          <Shield className="size-5 text-amber-500" />
          Locked Chats
        </div>
        <button
          onClick={getLockedChats}
          className="text-xs font-semibold px-2 py-1 bg-base-200 hover:bg-base-200 text-base-content/60 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {lockedChats.length > 0 ? (
        <div className="space-y-2">
          {lockedChats.map((chat) => (
            <button
              key={chat._id}
              type="button"
              onClick={() => handleOpenLockedChat(chat)}
              className="w-full rounded-xl border border-base-300 bg-base-100 p-3 text-left transition hover:bg-base-200 text-base-content hover:border-base-300 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content">{chat.fullName || chat.name}</span>
                <ShieldCheck className="size-4 text-primary" />
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">PIN protected</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-base-content/60 font-semibold py-1">No locked chats yet.</p>
      )}

      <ChatLockModal
        chat={activeChat}
        open={showModal}
        onSubmit={handleUnlockSubmit}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default LockedChatsPanel;
