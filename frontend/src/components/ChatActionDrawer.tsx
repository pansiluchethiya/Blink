import { X, Download, Pin, Shield, User, Info, Search, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import ExportChatModal from "./ExportChatModal";
import ChatPrivacyMenu from "./ChatPrivacyMenu";
import UserProfileModal from "./UserProfileModal";
import ChatInfoModal from "./ChatInfoModal";
import ChatThemePicker from "./ChatThemePicker";
import { useChatStore } from "../store/useChatStore";
import { Button } from "./ui";

const ChatActionDrawer = ({ 
  open, 
  onClose, 
  selectedUser, 
  chatSettings, 
  lockedChats,
  setChatExpiry,
  lockChat,
  unlockChat,
  onPinnedMessages,
  onSearch
}) => {
  const [activePanel, setActivePanel] = useState(null);
  const isLocked = selectedUser ? lockedChats.some((chat) => chat._id === selectedUser._id) : false;
  const { getChatTheme, setChatTheme } = useChatStore();
  const chatKey = selectedUser ? `dm:${selectedUser._id}` : null;
  const currentTheme = chatKey ? getChatTheme(chatKey) : null;

  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener("close-active-modal", handleClose);
    return () => window.removeEventListener("close-active-modal", handleClose);
  }, [onClose]);

  if (!open) return null;

  const renderPanel = () => {
    switch (activePanel) {
      case "export":
        return (
          <ExportChatModal 
            user={selectedUser} 
            onClose={() => setActivePanel(null)} 
          />
        );
      case "privacy":
        return (
          <ChatPrivacyMenu 
            open={true}
            onClose={() => setActivePanel(null)}
            selectedUser={selectedUser}
            chatSettings={chatSettings}
            isLocked={isLocked}
            onSetChatExpiry={setChatExpiry}
            onLockChat={lockChat}
            onUnlockChat={unlockChat}
          />
        );
      case "profile":
        return (
          <UserProfileModal 
            open={true} 
            onClose={() => setActivePanel(null)} 
            user={selectedUser} 
          />
        );
      case "theme":
        return chatKey ? (
          <ChatThemePicker
            peerName={selectedUser?.fullName || "Chat"}
            peerSeed={selectedUser?._id || "blink"}
            current={currentTheme}
            onSelect={(name) => setChatTheme(chatKey, name)}
          />
        ) : null;
      case "chatInfo":
        return (
          <ChatInfoModal 
            open={true} 
            onClose={() => setActivePanel(null)} 
            user={selectedUser} 
            chatSettings={chatSettings?.[selectedUser?._id]} 
          />
        );
      default:
        return (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => {
                onPinnedMessages && onPinnedMessages();
                onClose();
              }}
            >
              <Pin size={18} className="text-slate-500" />
              Pinned Messages
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => {
                onSearch && onSearch();
                onClose();
              }}
            >
              <Search size={18} className="text-slate-500" />
              Search
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => setActivePanel("export")}
            >
              <Download size={18} className="text-slate-500" />
              Export Chat
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => setActivePanel("privacy")}
            >
              <Shield size={18} className="text-slate-500" />
              Privacy Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => setActivePanel("profile")}
            >
              <User size={18} className="text-slate-500" />
              View Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => setActivePanel("chatInfo")}
            >
              <Info size={18} className="text-slate-500" />
              Chat Info
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left"
              onClick={() => setActivePanel("theme")}
            >
              <Palette size={18} className="text-slate-500" />
              Chat Theme
            </Button>
          </>
        );
    }
  };

  return (
    <div data-context="modal" className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="w-full sm:w-80 bg-base-100 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Chat Actions
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-1">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
};

export default ChatActionDrawer;