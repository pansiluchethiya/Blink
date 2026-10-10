import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useFolderStore, FOLDER_COLORS, type ChatFolder } from "../store/useFolderStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import Avatar from "./Avatar";
import {
  Search,
  MessageSquare,
  Plus,
  Users,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

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
    toggleCommandPalette,
  } = useChatStore();

  const { friends, requests, sentRequests, fetchFriends, fetchRequests } = useFriendStore();
  const { onlineUsers, authUser } = useAuthStore();
  const {
    folders,
    expanded,
    addFolder,
    renameFolder,
    deleteFolder,
    toggleMember,
    folderOf,
    toggleExpand,
  } = useFolderStore();

  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef(null);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<{ mode: "create" } | { mode: "rename"; folder: ChatFolder } | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);

  useEffect(() => {
    getUsers();
    fetchFriends();
    fetchRequests();
  }, [getUsers, fetchFriends, fetchRequests]);

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
    if (item.type === 'workspace') return false;
    return authUser?.pinnedChats?.includes(item._id);
  });

  const unpinnedItems = baseList.filter((item) => {
    if (item.type === 'workspace') return true;
    return !authUser?.pinnedChats?.includes(item._id);
  });

  const orderedItems = [...pinnedItems, ...unpinnedItems];
  const byId = new Map(orderedItems.map((i) => [String(i._id), i]));

  const selectItem = (item) => {
    if (item.type === 'workspace') {
      setSelectedUser(null);
      setSelectedWorkspace(item);
    } else {
      setSelectedWorkspace(null);
      setSelectedUser(item);
    }
  };

  const unreadOf = (item) => (item.type === 'user' ? item.unreadCount || 0 : 0);

  const openFolderModal = (mode: "create" | "rename", folder?: ChatFolder) => {
    if (mode === "create") {
      setFolderName("");
      setFolderColor(FOLDER_COLORS[folders.length % FOLDER_COLORS.length]);
      setFolderModal({ mode: "create" });
    } else if (folder) {
      setFolderName(folder.name);
      setFolderColor(folder.color);
      setFolderModal({ mode: "rename", folder });
    }
    setFolderMenuId(null);
  };

  const saveFolderModal = (e) => {
    e.preventDefault();
    if (!folderModal) return;
    if (folderModal.mode === "create") {
      addFolder(folderName, folderColor);
    } else {
      renameFolder(folderModal.folder.id, folderName, folderColor);
    }
    setFolderModal(null);
  };

  const renderUnreadPill = (count: number, onSelected: boolean) => {
    if (count <= 0) return null;
    return (
      <span
        className={`ml-2 flex-shrink-0 min-w-6 h-6 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
          onSelected ? "bg-base-100 text-primary" : "bg-primary text-primary-content"
        }`}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const renderMoveMenu = (item) => {
    if (rowMenuId !== String(item._id)) return null;
    const current = item.type === 'user' ? folderOf(String(item._id)) : undefined;
    return (
      <>
        <div className="fixed inset-0 z-20" onClick={() => setRowMenuId(null)} />
        <div className="absolute right-3 top-12 z-30 w-52 bg-base-100 border border-base-300 rounded-2xl shadow-xl p-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-base-content/40">
            Move to folder
          </p>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                toggleMember(f.id, String(item._id));
                setRowMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-base-200 text-left"
            >
              <span
                className="size-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ backgroundColor: `${f.color}22`, color: f.color }}
              >
                {f.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-sm font-medium text-base-content truncate">{f.name}</span>
              {current?.id === f.id && <Check size={15} className="text-primary flex-shrink-0" />}
            </button>
          ))}
          {current && (
            <button
              onClick={() => {
                toggleMember(current.id, String(item._id));
                setRowMenuId(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-base-200 text-left text-error"
            >
              <X size={15} className="ml-1" />
              <span className="text-sm font-medium">Remove from {current.name}</span>
            </button>
          )}
        </div>
      </>
    );
  };

  const renderUserRow = (user, compact = false) => {
    const isOnline = onlineUsers.includes(user._id);
    const lastMessage = user.lastMessage;
    const isSelected = selectedUser?._id === user._id && !selectedWorkspace;
    const preview = lastMessage?.text
      ? (lastMessage?.senderId === authUser?._id ? `You: ${lastMessage.text}` : lastMessage.text)
      : "No messages yet";

    return (
      <div
        key={user._id}
        role="button"
        tabIndex={0}
        onClick={() => selectItem({ ...user, type: 'user' })}
        onKeyDown={(e) => { if (e.key === "Enter") selectItem({ ...user, type: 'user' }); }}
        data-context="conversation"
        data-user-id={user._id}
        className={`w-full flex items-center gap-3 px-3 transition-all duration-200 relative group cursor-pointer ${
          compact ? "py-2 rounded-xl" : "py-3 rounded-2xl"
        } ${
          isSelected
            ? "bg-primary text-primary-content shadow-md"
            : "bg-base-200/60 hover:bg-base-200 text-base-content"
        }`}
      >
        <div className="relative flex-shrink-0">
          <Avatar user={user} className={compact ? "size-9" : "size-11"} />
          {isOnline && (
            <div className={`absolute bottom-0 right-0 rounded-full border-2 ${isSelected ? "border-primary" : "border-base-100"} bg-green-500 ${compact ? "size-2.5" : "size-3"}`} />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <h3 className={`font-semibold truncate leading-tight ${compact ? "text-sm" : "text-[15px]"}`}>
            {user.fullName}
          </h3>
          {!compact && (
            <p className={`text-[13px] truncate mt-0.5 ${isSelected ? "text-primary-content/80" : "text-base-content/50"}`}>
              {preview}
            </p>
          )}
        </div>

        {renderUnreadPill(user.unreadCount || 0, isSelected)}

        {!compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRowMenuId(rowMenuId === String(user._id) ? null : String(user._id));
            }}
            className={`p-1.5 rounded-lg flex-shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${
              isSelected ? "text-primary-content/80 hover:bg-black/10" : "text-base-content/40 hover:bg-base-300"
            }`}
            aria-label="Chat options"
          >
            <MoreHorizontal size={17} />
          </button>
        )}
        {renderMoveMenu({ ...user, type: 'user' })}
      </div>
    );
  };

  const renderWorkspaceRow = (workspace) => {
    const isSelected = selectedWorkspace?._id === workspace._id;
    const initials = workspace.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div
        key={workspace._id}
        role="button"
        tabIndex={0}
        onClick={() => selectItem({ ...workspace, type: 'workspace' })}
        onKeyDown={(e) => { if (e.key === "Enter") selectItem({ ...workspace, type: 'workspace' }); }}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 relative cursor-pointer ${
          isSelected
            ? "bg-primary text-primary-content shadow-md"
            : "bg-base-200/60 hover:bg-base-200 text-base-content"
        }`}
      >
        <div className="relative flex-shrink-0">
          <div
            style={workspace.icon ? { background: workspace.icon } : undefined}
            className={`size-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
              workspace.icon ? "text-white" : "bg-primary text-primary-content"
            }`}
          >
            {initials}
          </div>
          <div className={`absolute -bottom-1 -right-1 size-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-base-100 text-primary border-primary" : "bg-primary text-primary-content border-base-100"}`}>
            <Users size={10} />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold truncate text-[15px] leading-tight">{workspace.name}</h3>
          <p className={`text-[13px] truncate mt-0.5 ${isSelected ? "text-primary-content/80" : "text-base-content/50"}`}>
            {workspace.description || "Group"}
          </p>
        </div>
      </div>
    );
  };

  const renderItem = (item) => {
    if (item.type === 'workspace') return renderWorkspaceRow(item);
    return renderUserRow(item);
  };

  const renderFolderRow = (folder: ChatFolder) => {
    const members = folder.memberIds.map((id) => byId.get(String(id))).filter(Boolean);
    const unread = members.reduce((sum, m) => sum + unreadOf(m), 0);
    const isOpen = !!expanded[folder.id];

    return (
      <div key={folder.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleExpand(folder.id)}
          onKeyDown={(e) => { if (e.key === "Enter") toggleExpand(folder.id); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-base-200 transition-all cursor-pointer group relative"
        >
          <span
            className="size-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: `${folder.color}22`, color: folder.color }}
          >
            {folder.name.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 text-left text-[15px] font-medium text-base-content truncate">
            {folder.name}
          </span>
          {unread > 0 ? (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-content text-[11px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-base-200 text-base-content/50 text-[11px] font-bold flex items-center justify-center">
              {members.length}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-base-content/40 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
            }}
            className="p-1.5 rounded-lg text-base-content/40 hover:bg-base-300 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            aria-label="Folder options"
          >
            <MoreHorizontal size={16} />
          </button>
          {folderMenuId === folder.id && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setFolderMenuId(null)} />
              <div className="absolute right-3 top-12 z-30 w-44 bg-base-100 border border-base-300 rounded-2xl shadow-xl p-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openFolderModal("rename", folder)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-base-200 text-left"
                >
                  <Pencil size={15} className="text-base-content/50" />
                  <span className="text-sm font-medium text-base-content">Rename</span>
                </button>
                <button
                  onClick={() => { deleteFolder(folder.id); setFolderMenuId(null); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-error/10 text-left"
                >
                  <Trash2 size={15} className="text-error" />
                  <span className="text-sm font-medium text-error">Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
        {isOpen && members.length > 0 && (
          <div className="ml-6 pl-3 border-l-2 border-base-300/70 space-y-1 mt-1 mb-1">
            {members.map((m) => (m.type === 'workspace' ? renderWorkspaceRow(m) : renderUserRow(m, true)))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="h-full w-full bg-base-100 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 sticky top-0 z-10 bg-base-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] font-bold tracking-tight text-base-content">Chats</h1>
          <button
            onClick={() => toggleCommandPalette()}
            className="size-9 rounded-full bg-base-200 hover:bg-base-300 text-base-content/60 hover:text-base-content flex items-center justify-center transition-all"
            title="Search & jump"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/40 group-focus-within:text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            ref={searchRef}
            className="input w-full pl-11 pr-4 text-sm rounded-full bg-base-200 border-transparent focus:border-primary/40 focus:bg-base-100 placeholder:text-base-content/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pb-24">
        {isUsersLoading && orderedItems.length === 0 ? (
          <SidebarSkeleton />
        ) : searchInput ? (
          <div className="space-y-1.5">
            {orderedItems.length === 0 ? (
              <p className="text-center text-sm text-base-content/50 py-10">No results</p>
            ) : (
              orderedItems.map(renderItem)
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 mt-1 mb-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-base-content/40">
                Categories
              </p>
              <button
                onClick={() => openFolderModal("create")}
                className="size-6 rounded-full bg-base-200 hover:bg-primary hover:text-primary-content text-base-content/50 flex items-center justify-center transition-all"
                title="New folder"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5 mb-3">
              {folders.map(renderFolderRow)}
            </div>

            <div className="flex items-center justify-between px-2 mt-2 mb-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-base-content/40">
                All chats
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("sidebar-tab-users"))}
                className="size-6 rounded-full bg-base-200 hover:bg-primary hover:text-primary-content text-base-content/50 flex items-center justify-center transition-all"
                title="Find people"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {orderedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="size-14 rounded-3xl bg-base-200 flex items-center justify-center mb-3">
                    <MessageSquare className="size-7 text-base-content/40" />
                  </div>
                  <h3 className="font-semibold text-base-content mb-1">No chats yet</h3>
                  <p className="text-base-content/50 text-sm">Start a conversation with your friends or groups!</p>
                </div>
              ) : (
                orderedItems.map(renderItem)
              )}
            </div>
          </>
        )}
      </div>

      {/* Folder create / rename modal */}
      {folderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div
            className="w-full max-w-xs bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-5"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-base-content mb-4">
              {folderModal.mode === "create" ? "New folder" : "Rename folder"}
            </h2>
            <form onSubmit={saveFolderModal} className="space-y-4">
              <input
                type="text"
                required
                maxLength={24}
                placeholder="e.g. Work"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="input input-bordered w-full rounded-2xl"
                autoFocus
              />
              <div className="flex gap-2.5">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFolderColor(c)}
                    className={`size-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      folderColor === c ? "border-primary scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  >
                    {folderColor === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setFolderModal(null)} className="btn btn-ghost btn-sm rounded-full">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm rounded-full">
                  {folderModal.mode === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ConversationList;
