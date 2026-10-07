import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Link } from "react-router-dom";
import FrequentContacts from "./FrequentContacts";
import Avatar from "./Avatar";
import { Button } from "./ui";
import Input from "./ui/Input";
import { Search, Edit3, Zap, MoreHorizontal, CheckCircle2, MessageSquare, Plus, Users } from "lucide-react";
import { formatMessageTime, getUserHandle } from "../lib/utils";

  const ConversationList = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    searchUsers,
    searchResults,
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
  } = useChatStore();

  const { friends, requests, sentRequests, fetchFriends, fetchRequests } = useFriendStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    getUsers();
    fetchFriends();
    fetchRequests();
  }, [getUsers, fetchFriends, fetchRequests]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchUsers]);

  const isRelated = (userId) => {
    if (!userId) return false;
    const uid = String(userId);
    const isFriend = friends.some(f => String(f._id) === uid);
    if (isFriend) return true;
    const hasIncoming = requests.some(r => r.requesterId && String(r.requesterId._id) === uid);
    if (hasIncoming) return true;
    const hasOutgoing = sentRequests.some(r => r.receiverId && String(r.receiverId._id) === uid);
    if (hasOutgoing) return true;
    return false;
  };

  const frequentUsers = friends.slice(0, 5);

  // Combined list of users and workspaces
  const combinedList = [
    ...users.map(u => ({ ...u, type: 'user' })),
    ...workspaces.map(w => ({ ...w, type: 'workspace' }))
  ];

  const displayList = searchInput
    ? searchResults.map(u => ({ ...u, type: 'user' }))
    : combinedList;

  const baseList = displayList
    .filter((item) => {
      if (item.type === 'workspace') return true;
      return searchInput || item.lastMessage || isRelated(item._id);
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const pinnedItems = baseList.filter((item) => {
    if (item.type === 'workspace') return false; // Workspaces not pinnable yet in this logic
    return authUser?.pinnedChats?.includes(item._id);
  });

  const unpinnedItems = baseList.filter((item) => {
    if (item.type === 'workspace') return true;
    return !authUser?.pinnedChats?.includes(item._id);
  });

  const renderItem = (item) => {
    if (item.type === 'workspace') return renderWorkspaceItem(item);
    return renderUserItem(item);
  };

  const renderWorkspaceItem = (workspace) => {
    const isSelected = selectedWorkspace?._id === workspace._id;
    const initials = workspace.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
      <button
        key={workspace._id}
        onClick={() => {
          setSelectedUser(null);
          setSelectedWorkspace(workspace);
        }}
        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-200 border-b border-base-300 relative overflow-hidden group ${
          isSelected
            ? "bg-base-300"
            : "hover:bg-base-200"
        }`}
      >
        <div className="relative flex-shrink-0">
          <div
            style={workspace.icon ? { background: workspace.icon } : undefined}
            className={`size-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
              workspace.icon
                ? "text-white"
                : "bg-primary text-primary-content"
            }`}
          >
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 size-5 bg-primary text-primary-content rounded-full border-2 border-base-100 flex items-center justify-center">
            <Users size={10} />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-base-content truncate text-[16px]">
              {workspace.name}
            </h3>
            <span className="text-[12px] text-base-content/40 font-medium">Group</span>
          </div>
          <p className="text-[14px] text-base-content/50 truncate">
            {workspace.description || ""}
          </p>
        </div>

        {isSelected && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
        )}
      </button>
    );
  };

  const renderUserItem = (user) => {
    const isOnline = onlineUsers.includes(user._id);
    const lastMessage = user.lastMessage;
    const isSelected = selectedUser?._id === user._id;
    const lastTime = lastMessage?.createdAt ? formatMessageTime(lastMessage.createdAt) : "";

    return (
      <button
        key={user._id}
        data-context="conversation"
        data-user-id={user._id}
        onClick={() => setSelectedUser(user)}
        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-200 border-b border-base-300 relative overflow-hidden group ${
          isSelected
            ? "bg-base-300"
            : "hover:bg-base-200"
        }`}
      >
        <div className="relative flex-shrink-0">
          <Avatar user={user} className="size-12 ring-2 ring-transparent group-hover:ring-primary/20" />
          {isOnline && (
            <div className="absolute bottom-0 right-0 size-3.5 bg-success rounded-full border-2 border-base-100" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-base-content truncate text-[16px] flex items-center gap-1.5">
              {user.fullName}
              <Link
                to={`/u/${getUserHandle(user).replace("@", "")}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary hover:underline font-bold opacity-85"
              >
                {getUserHandle(user)}
              </Link>
            </h3>
            <span className="text-[12px] text-base-content/40 font-medium">{lastTime}</span>
          </div>

          <div className="flex justify-between items-center">
            <p className={`text-[14px] truncate ${user.unreadCount > 0 ? "text-base-content font-medium" : "text-base-content/50"}`}>
              {lastMessage?.senderId === authUser._id && <span className="text-primary mr-1 font-bold">You:</span>}
              {lastMessage?.text || "No messages yet"}
            </p>

            {user.unreadCount > 0 ? (
              <span className="badge badge-primary ml-2 text-[11px] font-bold">
                {user.unreadCount}
              </span>
            ) : (
              lastMessage?.senderId === authUser._id && (
                <CheckCircle2 size={14} className="text-primary/40 ml-2" />
              )
            )}
          </div>
        </div>

        {isSelected && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
        )}
      </button>
    );
  };

  return (
    <aside className="h-full w-full bg-base-100 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5 border-b border-base-300 bg-base-100 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center">
              <Zap size={20} className="text-primary-content fill-current" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-base-content">Blink</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sidebar-create-server"))}
              className="p-2 text-base-content/50 hover:text-primary hover:bg-base-200 rounded-xl transition-all"
              title="Create Group"
            >
              <Plus size={22} />
            </button>
            <button
              onClick={() => searchRef.current?.focus()}
              className="p-2 text-base-content/50 hover:text-primary hover:bg-base-200 rounded-xl transition-all"
            >
              <Search size={22} />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/40 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search messages or people"
            value={searchInput}
            onChange={handleSearch}
            ref={searchRef}
            className="input input-bordered w-full pl-11 pr-4 text-sm placeholder:text-base-content/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {!searchInput && frequentUsers.length > 0 && (
          <div className="py-2">
            <FrequentContacts users={frequentUsers} onSelectUser={setSelectedUser} />
          </div>
        )}

        <div className="pb-20">
          {pinnedItems.length === 0 && unpinnedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
              <div className="size-16 rounded-3xl bg-base-200 flex items-center justify-center mb-4">
                <MessageSquare className="size-8 text-base-content/40" />
              </div>
              <h3 className="font-semibold text-base-content mb-1">No chats yet</h3>
              <p className="text-base-content/50 text-sm">Start a conversation with your friends or groups!</p>
            </div>
          ) : (
            <>
              {pinnedItems.map(renderItem)}
              {unpinnedItems.map(renderItem)}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ConversationList;
