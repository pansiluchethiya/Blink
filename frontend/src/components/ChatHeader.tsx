import { X, Search, Phone, Video, ArrowLeft, MoreHorizontal } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { getUserHandle } from "../lib/utils";
import Avatar from "./Avatar";

const ChatHeader = ({ onSearchClick, onPinnedClick, onBurgerClick, onAvatarClick, onMoreClick }) => {
   const { selectedUser, setSelectedUser, userStatus } = useChatStore();
   const { onlineUsers: authOnlineUsers } = useAuthStore();

  const status = userStatus[selectedUser?._id];
  const isOnline = authOnlineUsers.includes(selectedUser?._id);

  if (!selectedUser) return <div className="h-16 flex-shrink-0" />;

  return (
    <div className="px-4 py-3 border-b border-base-300 bg-base-100/80 backdrop-blur flex-shrink-0 z-20 select-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back button — mobile only */}
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 -ml-2 hover:bg-base-200 rounded-full transition-colors md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="text-base-content" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer group" onClick={onAvatarClick}>
            <div className="transition-transform duration-300 group-hover:scale-105">
              <Avatar user={selectedUser} className="size-10" />
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3 bg-success rounded-full border-2 border-base-100" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={onAvatarClick}>
            <h3 className="font-bold text-[17px] text-base-content leading-tight truncate flex items-center gap-1.5">
              {selectedUser.fullName}
              <Link
                to={`/u/${getUserHandle(selectedUser).replace("@", "")}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] text-primary hover:underline font-bold opacity-85"
              >
                {getUserHandle(selectedUser)}
              </Link>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[12px] font-medium ${isOnline ? "text-success" : "text-base-content/40"}`}>
                {isOnline ? "Active now" : "Offline"}
              </span>
              {status?.statusMessage && (
                <span className="text-[12px] text-base-content/50 truncate hidden sm:inline">• "{status.statusMessage}"</span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-base-200 rounded-full transition-all text-primary hover:scale-105">
            <Phone size={20} />
          </button>
          <button className="p-2.5 hover:bg-base-200 rounded-full transition-all text-primary hover:scale-105">
            <Video size={20} />
          </button>

          <div className="w-[1px] h-6 bg-base-300 mx-1 hidden sm:block" />

          <button
            onClick={onSearchClick}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all"
          >
            <Search size={20} />
          </button>

          <button
            onClick={onMoreClick}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all"
          >
            <MoreHorizontal size={20} />
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all hidden lg:inline-flex"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
