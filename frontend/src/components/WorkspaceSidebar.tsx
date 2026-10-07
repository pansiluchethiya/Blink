import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "./Avatar";
import { Megaphone, BadgeInfo, X, Hash, BarChart2, FolderOpen, Plus, Users, ChevronDown, Volume2 } from "lucide-react";

const WorkspaceSidebar = () => {
  const {
    workspaces,
    selectedWorkspace,
    selectedChannelId,
    setSelectedChannelId,
    createChannel,
    deleteWorkspace,
    promoteToAdmin,
    demoteFromAdmin
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  const isOwner = selectedWorkspace?.owner === authUser?._id;
  const isAdmin = isOwner || selectedWorkspace?.admins.includes(authUser?._id || "");

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("chat");
  const [showMembers, setShowMembers] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  if (!selectedWorkspace) {
    if (workspaces.length > 0) return null;
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-base-100">
        <div className="card bg-base-200 p-6 text-center max-w-xs">
          <h3 className="font-bold text-base-content">No groups yet</h3>
          <p className="text-sm text-base-content/50 mt-1 mb-4">
            Create your first group to chat with your team.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.dispatchEvent(new CustomEvent("sidebar-create-server"))}
          >
            Create your first group
          </button>
        </div>
      </div>
    );
  }

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createChannel(selectedWorkspace._id, newChannelName.trim(), newChannelType);
    setNewChannelName("");
    setShowCreateChannelModal(false);
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "announcements":
        return <Megaphone className="w-4 h-4 mr-2" />;
      case "polls":
        return <BarChart2 className="w-4 h-4 mr-2" />;
      case "resources":
        return <FolderOpen className="w-4 h-4 mr-2" />;
      case "voice":
        return <Volume2 className="w-4 h-4 mr-2" />;
      default:
        return <Hash className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <aside className="w-64 h-full glass border-r border-base-300 flex flex-col z-20 flex-shrink-0 select-none transition-colors duration-200">
        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAnnouncementModal(false)}>
            <div className="bg-base-100 rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 p-1 rounded hover:bg-base-200/40" onClick={() => setShowAnnouncementModal(false)}>
                <X className="w-4 h-4 text-base-content/60" />
              </button>
              <h2 className="text-lg font-bold mb-4 text-base-content">🆕 New Features (v2.3.0)</h2>
              <ul className="list-disc list-inside space-y-2 text-base-content/60">
                <li>Real‑time typing indicators for all users.</li>
                <li>Optimistic UI for channel messages.</li>
                <li>Enhanced dark‑mode glassmorphic sidebar.</li>
                <li>Announcement modal to showcase new features.</li>
              </ul>
            </div>
          </div>
        )}
      {/* Group Header */}
        <button className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-base-content/60 hover:bg-base-200/50 rounded" onClick={() => setShowAnnouncementModal(true)}>
          <BadgeInfo className="w-4 h-4" />
          <span>What’s New</span>
        </button>
      <div className="h-16 px-4 border-b border-base-300 flex items-center justify-between hover:bg-base-200/50 cursor-pointer transition">
        <div className="flex flex-col">
          <span className="font-bold text-base-content text-sm truncate max-w-[180px]">
            {selectedWorkspace.name}
          </span>
          <span className="text-[10px] text-base-content/60 font-medium truncate max-w-[180px]">
            {selectedWorkspace.description || "Group Info"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-base-content/60" />
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-thin">
        {/* Only show Channels if there's more than one, otherwise it's just a group chat */}
        {selectedWorkspace.channels.length > 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/60">
              <span>Topics</span>
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="hover:text-base-content transition p-0.5 rounded hover:bg-base-200"
                title="Add Topic"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {selectedWorkspace.channels.map((chan) => {
                const isActive = selectedChannelId === chan._id;
                return (
                  <button
                    key={chan._id}
                    onClick={() => setSelectedChannelId(chan._id)}
                    className={`w-full flex items-center px-2 py-2 rounded-lg text-sm font-semibold transition duration-150 ${
                      isActive
                        ? "bg-base-200 text-base-content shadow-sm"
                        : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                    }`}
                  >
                    {getChannelIcon(chan.type)}
                    <span className="truncate">{chan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Members Roster Section */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className="w-full flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-base-content/60 hover:text-base-content transition focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>Members ({selectedWorkspace.members?.length || 0})</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showMembers ? "" : "-rotate-90"}`} />
          </button>

          {showMembers && (
            <div className="space-y-1 mt-1">
              {selectedWorkspace.members?.map((member) => {
                const memberUser = typeof member === 'string' ? null : member;
                if (!memberUser) return null;
                const isOnline = onlineUsers.includes(memberUser._id);
                const isMemberAdmin = selectedWorkspace.admins.includes(memberUser._id);
                
                return (
                  <div
                    key={memberUser._id}
                    className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-lg hover:bg-base-200/40 transition text-base-content/60 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Avatar user={memberUser} className="size-6" />
                        <span
                          className={`absolute bottom-0 right-0 size-2 rounded-full border border-base-100 ${
                            isOnline ? "bg-green-500" : "bg-base-300"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-base-content truncate">
                          {memberUser.fullName}
                        </span>
                      </div>
                    </div>

                    {isAdmin && !isOwner && memberUser._id !== authUser?._id && (
                      <div className="flex gap-1">
                        {isMemberAdmin ? (
                          <button onClick={() => demoteFromAdmin(selectedWorkspace._id, memberUser._id)} className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Demote</button>
                        ) : (
                          <button onClick={() => promoteToAdmin(selectedWorkspace._id, memberUser._id)} className="text-[10px] text-primary hover:text-primary font-bold">Promote</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Group Section */}
      {isOwner && (
        <div className="p-3 border-t border-base-300">
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to delete this group?")) {
                deleteWorkspace(selectedWorkspace._id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold transition"
          >
            Delete Group
          </button>
        </div>
      )}

      {/* Invite Member Drawer Footer */}
      <div className="p-3 bg-base-200 border-t border-base-300">
        <div className="flex items-center justify-between rounded-xl bg-base-200/50 p-2 border border-base-300">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-base-content/60 font-bold uppercase tracking-wide">Invite Link</span>
            <span className="text-[11px] text-primary font-semibold truncate select-all cursor-pointer">
              Blink.chat/{selectedWorkspace.name.toLowerCase().replace(/\s+/g, "-")}
            </span>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-base-content mb-2">Create Topic</h2>
            <p className="text-base-content/60 text-xs mb-5">
              Configure a dedicated topic for focused group chats, real-time polls, or resource galleries.
            </p>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              {/* Channel Name input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                  Topic Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 font-semibold">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="input input-bordered w-full pl-8 pr-4 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Channel Type */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                  Topic Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "chat", label: "Text Chat", icon: <Hash className="w-3.5 h-3.5 mr-1" /> },
                    { type: "polls", label: "Polls", icon: <BarChart2 className="w-3.5 h-3.5 mr-1" /> },
                    { type: "resources", label: "Resources", icon: <FolderOpen className="w-3.5 h-3.5 mr-1" /> },
                    { type: "voice", label: "Voice", icon: <Volume2 className="w-3.5 h-3.5 mr-1" /> }
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewChannelType(item.type)}
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                        newChannelType === item.type
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-base-200 border-base-300 text-base-content/60 hover:border-base-300 hover:text-base-content"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-3.5 py-1.5 text-base-content/60 hover:text-base-content text-xs font-bold rounded-lg hover:bg-base-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary text-primary-content text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default WorkspaceSidebar;
