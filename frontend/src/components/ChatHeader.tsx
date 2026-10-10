import { X, Search, Phone, Video, ArrowLeft, MoreHorizontal, PanelRight } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

const ChatHeader = ({ onSearchClick, onMediaClick, mediaOpen, onPinnedClick, onBurgerClick, onAvatarClick, onMoreClick }) => {
   const { selectedUser, setSelectedUser, userStatus } = useChatStore();
   const { onlineUsers: authOnlineUsers } = useAuthStore();

  const status = userStatus[selectedUser?._id];
  const isOnline = authOnlineUsers.includes(selectedUser?._id);

  if (!selectedUser) return <div className="h-16 flex-shrink-0" />;

  const notAvailable = () => toast("Voice and video calls aren't available yet", { icon: "📵" });

  return (
    <div className="px-4 py-3 border-b border-base-200 bg-base-100 flex-shrink-0 z-20 select-none">
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
              <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-base-100" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={onAvatarClick}>
            <h3 className="font-bold text-[17px] text-base-content leading-tight truncate flex items-center gap-1.5">
              {selectedUser.fullName}
              <span
                className={`size-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-base-300"}`}
                title={isOnline ? "Online" : "Offline"}
              />
            </h3>
            {status?.statusMessage && (
              <p className="text-[12px] text-base-content/50 truncate mt-0.5 hidden sm:block">
                "{status.statusMessage}"
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={notAvailable}
            className="p-2.5 hover:bg-base-200 rounded-full transition-all text-primary hover:scale-105"
            title="Voice call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={notAvailable}
            className="p-2.5 hover:bg-base-200 rounded-full transition-all text-primary hover:scale-105"
            title="Video call"
          >
            <Video size={20} />
          </button>

          <div className="w-[1px] h-6 bg-base-300 mx-1 hidden sm:block" />

          <button
            onClick={onMediaClick}
            className={`p-2.5 rounded-full transition-all ${mediaOpen ? "bg-primary/10 text-primary" : "text-base-content/50 hover:text-base-content hover:bg-base-200"}`}
            title="Shared media"
          >
            <PanelRight size={20} />
          </button>

          <button
            onClick={onSearchClick}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all"
            title="Search in conversation"
          >
            <Search size={20} />
          </button>

          <button
            onClick={onMoreClick}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all"
            title="More"
          >
            <MoreHorizontal size={20} />
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className="p-2.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all hidden lg:inline-flex"
            title="Close conversation"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
