import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore, BLINK_LIGHT, BLINK_DARK } from "../store/useThemeStore";
import { useFriendStore } from "../store/useFriendStore";
import {
  Heart,
  MessageCircle,
  Copy,
  Edit,
  Trash2,
  Pin,
  Share2,
  User,
  MessageSquare,
  Slash,
  RefreshCw,
  SunMoon,
  Settings,
  Image as ImageIcon,
  CopyIcon,
  Maximize2,
  Download,
  Clipboard,
  Scissors,
  Eraser,
  Globe,
  Inbox,
  CheckCircle2,
  X,
  Bell,
  Plus,
  Send,
  LogOut
} from "lucide-react";
import toast from "react-hot-toast";
import ForwardModal from "./ForwardModal";
import UserProfileModal from "./UserProfileModal";
import { useNavigate } from "react-router-dom";
import { getUserHandle } from "../lib/utils";

interface ContextMenuContextProps {
  showMenu: (e: React.MouseEvent, type: string, targetData: any) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextProps | null>(null);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within a ContextMenuProvider");
  }
  return context;
};

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: string;
    data: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    type: "general",
    data: null,
  });

  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const navigate = useNavigate();

  const { authUser, logout } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const {
    messages,
    addReaction,
    removeReaction,
    deleteMessage,
    togglePinMessage,
    setEditingMessage,
    setReplyingToMessage,
    setSelectedUser,
    users,
    setLightboxImage
  } = useChatStore();

  const { blockUser, friends } = useFriendStore();

  const menuRef = useRef<HTMLDivElement>(null);

  const hideMenu = useCallback(() => {
    setMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  // Listen to window right-clicks
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      // Don't intercept if clicking inside our own context menu
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }

      e.preventDefault();

      const target = e.target as HTMLElement;
      let type = "general";
      let data: any = {};

      // 1. Detect Message Context
      const messageEl = target.closest('[data-context="message"]');
      if (messageEl) {
        const messageId = messageEl.getAttribute("data-message-id");
        const foundMsg = messages.find((m) => m._id === messageId);
        if (foundMsg) {
          type = "message";
          data = { message: foundMsg };
        }
      }

      // 2. Detect User/Conversation Sidebar Context
      const conversationEl = target.closest('[data-context="conversation"]');
      if (conversationEl && type === "general") {
        const userId = conversationEl.getAttribute("data-user-id");
        const foundUser = users.find((u) => u._id === userId);
        if (foundUser) {
          type = "conversation";
          data = { user: foundUser };
        }
      }

      // 3. Detect Input/Textarea Context
      const inputEl = target.closest("input, textarea") as HTMLInputElement | HTMLTextAreaElement | null;
      if (inputEl && type === "general") {
        type = "input";
        data = { element: inputEl };
      }

      // 4. Detect Image Context
      const imageEl = target.closest("img") as HTMLImageElement | null;
      if (imageEl && type === "general") {
        type = "image";
        data = { src: imageEl.src, alt: imageEl.alt };
      }

      // 5. Detect Settings Context
      const settingsEl = target.closest('[data-context="settings"]');
      if (settingsEl && type === "general") {
        type = "settings";
        data = {};
      }

      // 6. Detect Modal Context
      const modalEl = target.closest('[data-context="modal"]');
      if (modalEl && type === "general") {
        type = "modal";
        data = {};
      }

      // 7. Detect Friends Section Context
      const friendsSectionEl = target.closest('[data-context="friends-section"]');
      if (friendsSectionEl && type === "general") {
        type = "friends-section";
        data = {};
      }

      // 8. Detect Sidebar Context
      const sidebarEl = target.closest('[data-context="sidebar"]');
      if (sidebarEl && type === "general") {
        type = "sidebar";
        data = {};
      }

      // 9. Detect Navbar Context
      const navbarEl = target.closest('[data-context="navbar"]');
      if (navbarEl && type === "general") {
        type = "navbar";
        data = {};
      }

      // Calculate safe coordinates inside viewport
      const menuWidth = 220;
      const menuHeight = 350;
      let x = e.clientX;
      let y = e.clientY;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }

      setMenu({
        visible: true,
        x,
        y,
        type,
        data,
      });
    };

    const handleGlobalClick = () => {
      hideMenu();
    };

    window.addEventListener("contextmenu", handleGlobalContextMenu);
    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [messages, users, hideMenu]);

  const showMenu = (e: React.MouseEvent, type: string, targetData: any) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate safe coordinates inside viewport
    const menuWidth = 220;
    const menuHeight = 350;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setMenu({
      visible: true,
      x,
      y,
      type,
      data: targetData,
    });
  };

  // Actions
  const handleReaction = (messageId: string, emoji: string) => {
    const message = messages.find((m) => m._id === messageId);
    if (!message) return;
    const hasReaction = message.reactions?.[emoji]?.includes(authUser._id);
    if (hasReaction) {
      removeReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
    hideMenu();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy");
    });
    hideMenu();
  };

  const handleEdit = (messageId: string) => {
    setEditingMessage(messageId);
    hideMenu();
  };

  const handleReply = (message: any) => {
    setReplyingToMessage(message);
    hideMenu();
  };

  const handleDelete = (messageId: string) => {
    if (confirm("Delete this message?")) {
      deleteMessage(messageId);
    }
    hideMenu();
  };

  const handlePin = (messageId: string, isPinned: boolean) => {
    togglePinMessage(messageId);
    toast.success(isPinned ? "Message unpinned" : "Message pinned");
    hideMenu();
  };

  const handleForward = (messageId: string) => {
    setForwardMessageId(messageId);
    hideMenu();
  };

  const handleOpenChat = (user: any) => {
    setSelectedUser(user);
    hideMenu();
  };

  const handleBlockUser = (userId: string) => {
    if (confirm("Are you sure you want to block this user?")) {
      blockUser(userId);
    }
    hideMenu();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleInputCut = (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.focus();
    const selectedText = el.value.substring(el.selectionStart || 0, el.selectionEnd || 0);
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        el.value = el.value.substring(0, start) + el.value.substring(end);
        toast.success("Cut to clipboard");
      });
    }
    hideMenu();
  };

  const handleInputCopy = (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.focus();
    const selectedText = el.value.substring(el.selectionStart || 0, el.selectionEnd || 0);
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        toast.success("Copied selection");
      });
    } else {
      navigator.clipboard.writeText(el.value).then(() => {
        toast.success("Copied input text");
      });
    }
    hideMenu();
  };

  const handleInputPaste = async (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.focus();
    try {
      const text = await navigator.clipboard.readText();
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      el.value = el.value.substring(0, start) + text + el.value.substring(end);
      toast.success("Pasted text");
    } catch {
      toast.error("Failed to read clipboard");
    }
    hideMenu();
  };

  const handleInputClear = (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.value = "";
    hideMenu();
  };

  const handleImageLightbox = (src: string) => {
    setLightboxImage(src);
    hideMenu();
  };

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu }}>
      {children}

      {menu.visible && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-base-100/70 backdrop-blur-xl border border-base-300/50 rounded-2xl shadow-2xl p-1.5 min-w-[220px] max-w-[260px] flex flex-col gap-0.5 select-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            top: menu.y,
            left: menu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Message Context Menu */}
          {menu.type === "message" && menu.data?.message && (
            <>
              {/* Reactions strip */}
              {!menu.data.message.isDeleted && (
                <div className="flex justify-between items-center px-2 py-1.5 mb-1.5 border-b border-base-300">
                  {["👍", "❤️", "😂", "🔥", "🚀"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(menu.data.message._id, emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-base-200/50"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleReply(menu.data.message)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <MessageCircle size={15} className="text-base-content/60" />
                Reply
              </button>

              {menu.data.message.text && (
                <button
                  onClick={() => handleCopy(menu.data.message.text)}
                  className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
                >
                  <Copy size={15} className="text-base-content/60" />
                  Copy Text
                </button>
              )}

              <button
                onClick={() => handlePin(menu.data.message._id, menu.data.message.isPinned)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Pin size={15} className="text-base-content/60" />
                {menu.data.message.isPinned ? "Unpin Message" : "Pin Message"}
              </button>

              <button
                onClick={() => handleForward(menu.data.message._id)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Share2 size={15} className="text-base-content/60" />
                Forward Message
              </button>

              {menu.data.message.senderId === authUser._id && !menu.data.message.isDeleted && (
                <>
                  <div className="h-px bg-base-200 my-1" />
                  <button
                    onClick={() => handleEdit(menu.data.message._id)}
                    className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
                  >
                    <Edit size={15} className="text-base-content/60" />
                    Edit Message
                  </button>

                  <button
                    onClick={() => handleDelete(menu.data.message._id)}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-600 transition-colors"
                  >
                    <Trash2 size={15} className="text-red-500" />
                    Delete Message
                  </button>
                </>
              )}
            </>
          )}

          {/* 2. User/Conversation Context Menu */}
          {menu.type === "conversation" && menu.data?.user && (
            <>
              <button
                onClick={() => handleOpenChat(menu.data.user)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <MessageSquare size={15} className="text-base-content/60" />
                Open Direct Chat
              </button>

              <button
                onClick={() => {
                  navigate(`/u/${getUserHandle(menu.data.user).replace("@", "")}`);
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <User size={15} className="text-base-content/60" />
                View Profile Card
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => handleBlockUser(menu.data.user._id)}
                className="w-full px-3 py-2 text-left hover:bg-red-50 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-600 transition-colors"
              >
                <Slash size={15} className="text-red-500" />
                Block & Mute User
              </button>
            </>
          )}

          {/* 3. Input Element Context Menu */}
          {menu.type === "input" && menu.data?.element && (
            <>
              <button
                onClick={() => handleInputCut(menu.data.element)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Scissors size={15} className="text-base-content/60" />
                Cut Selection
              </button>

              <button
                onClick={() => handleInputCopy(menu.data.element)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <CopyIcon size={15} className="text-base-content/60" />
                Copy
              </button>

              <button
                onClick={() => handleInputPaste(menu.data.element)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Clipboard size={15} className="text-base-content/60" />
                Paste
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => handleInputClear(menu.data.element)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content transition-colors"
              >
                <Eraser size={15} className="text-base-content/60" />
                Clear All Text
              </button>
            </>
          )}

          {/* 4. Image Context Menu */}
          {menu.type === "image" && menu.data && (
            <>
              <button
                onClick={() => handleImageLightbox(menu.data.src)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Maximize2 size={15} className="text-base-content/60" />
                Open Lightbox
              </button>

              <button
                onClick={() => handleCopy(menu.data.src)}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Copy size={15} className="text-base-content/60" />
                Copy Image URL
              </button>

              <a
                href={menu.data.src}
                download={menu.data.alt || "download"}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
                onClick={hideMenu}
              >
                <Download size={15} className="text-base-content/60" />
                Download Attachment
              </a>
            </>
          )}

          {/* 6. Settings Context Menu */}
          {menu.type === "settings" && (
            <>
              <button
                onClick={() => {
                  setTheme(BLINK_LIGHT);
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <SunMoon size={15} className="text-amber-500" />
                Set Light Mode
              </button>
              <button
                onClick={() => {
                  setTheme(BLINK_DARK);
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <SunMoon size={15} className="text-primary" />
                Set Dark Mode
              </button>
              <button
                onClick={() => {
                  setTheme("system");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <SunMoon size={15} className="text-base-content/60" />
                Sync with OS Theme
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => {
                  const sendOnEnter = useChatStore.getState().chatSettings?.sendOnEnter ?? true;
                  useChatStore.getState().setChatSetting('sendOnEnter', !sendOnEnter);
                  toast.success(`Send on Enter: ${!sendOnEnter ? "Enabled" : "Disabled"}`);
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Send size={15} className="text-base-content/60" />
                Toggle Send on Enter
              </button>

              <button
                onClick={() => {
                  navigate("/");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <MessageSquare size={15} className="text-primary" />
                Back to DMs
              </button>
            </>
          )}

          {/* 7. Modal Context Menu */}
          {menu.type === "modal" && (
            <>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("close-active-modal"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <X size={15} className="text-base-content/60" />
                Close Modal
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("submit-active-modal"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <CheckCircle2 size={15} className="text-primary" />
                Submit / Confirm
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => {
                  toast.success("Help and guidelines for dialog forms loaded.");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Settings size={15} className="text-base-content/60" />
                Form Assistance
              </button>
            </>
          )}

          {/* 8. Friends Section Context Menu */}
          {menu.type === "friends-section" && (
            <>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("friends-tab-explore"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Globe size={15} className="text-primary" />
                Explore People
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("friends-tab-friends"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Users size={15} className="text-primary" />
                View Friends
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("friends-tab-requests"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Inbox size={15} className="text-primary" />
                Friend Requests
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => {
                  useChatStore.getState().getUsers();
                  useFriendStore.getState().fetchFriends();
                  useFriendStore.getState().fetchRequests();
                  toast.success("Synchronized contacts list");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <RefreshCw size={15} className="text-base-content/60" />
                Refresh Connections
              </button>
            </>
          )}

          {/* 9. Sidebar Context Menu */}
          {menu.type === "sidebar" && (
            <>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("sidebar-tab-chats"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <MessageSquare size={15} className="text-primary" />
                Direct Messages
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("sidebar-tab-users"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Users size={15} className="text-primary" />
                View Friends List
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("sidebar-tab-notifications"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Bell size={15} className="text-primary" />
                Notifications
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("sidebar-create-server"));
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Plus size={15} className="text-primary" />
                Create a Server
              </button>

              <button
                onClick={() => {
                  logout();
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-red-50 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-600 transition-colors"
              >
                <LogOut size={15} className="text-red-500" />
                Log Out Account
              </button>
            </>
          )}

          {/* 10. Navbar Context Menu */}
          {menu.type === "navbar" && (
            <>
              {authUser && (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("navbar-status-modal"));
                    hideMenu();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
                >
                  <MessageCircle size={15} className="text-primary" />
                  Update Status message
                </button>
              )}

              <button
                onClick={() => {
                  navigate("/settings");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Settings size={15} className="text-base-content/60" />
                Go to Settings
              </button>

              {authUser && (
                <>
                  <div className="h-px bg-base-200 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      hideMenu();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-600 transition-colors"
                  >
                    <LogOut size={15} className="text-red-500" />
                    Log Out Account
                  </button>
                </>
              )}
            </>
          )}

          {/* 5. General Context Menu */}
          {menu.type === "general" && (
            <>
              <button
                onClick={toggleTheme}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <SunMoon size={15} className="text-base-content/60" />
                Toggle Dark Mode ({theme})
              </button>

              <button
                onClick={() => {
                  navigate("/settings");
                  hideMenu();
                }}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content/60 transition-colors"
              >
                <Settings size={15} className="text-base-content/60" />
                App Preferences
              </button>

              <div className="h-px bg-base-200 my-1" />

              <button
                onClick={handleRefresh}
                className="w-full px-3 py-2 text-left hover:bg-base-200/80 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-base-content transition-colors"
              >
                <RefreshCw size={15} className="text-base-content/60" />
                Reload Application
              </button>
            </>
          )}
        </div>
      )}

      {/* Render Forward Modal globally on context menu select */}
      {forwardMessageId && (
        <ForwardModal
          messageId={forwardMessageId}
          onClose={() => setForwardMessageId(null)}
        />
      )}

      {/* Render User Profile Modal globally on context menu select */}
      {profileUser && (
        <UserProfileModal
          open={!!profileUser}
          onClose={() => setProfileUser(null)}
          user={profileUser}
        />
      )}
    </ContextMenuContext.Provider>
  );
};
