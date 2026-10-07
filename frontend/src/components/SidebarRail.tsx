import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Avatar from "./Avatar";
import {
  Settings,
  LogOut,
  Plus,
  Users,
  Bell,
  MessageSquare
} from "lucide-react";

const SidebarRail = ({ activeTab = "chats", setActiveTab = () => {}, forceShow = false }) => {
  const { logout, authUser } = useAuthStore();
  const {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    createWorkspace
  } = useChatStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#7c3aed");

  // Solid workspace icon colors. These are opaque strings persisted to the
  // backend as the workspace `icon` (user data, applied via inline style) —
  // not theme colors.
  const colors = [
    { label: "Rose", value: "#e11d48" },
    { label: "Orange", value: "#ea580c" },
    { label: "Green", value: "#16a34a" },
    { label: "Blue", value: "#2563eb" },
    { label: "Violet", value: "#7c3aed" },
    { label: "Pink", value: "#db2777" }
  ];

  const handleCreateServer = (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    createWorkspace(newServerName.trim(), selectedColor);
    setNewServerName("");
    setShowCreateModal(false);
  };

  const getWorkspaceInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const showChats = () => { setSelectedWorkspace(null); setActiveTab("chats"); };
    const showUsers = () => { setSelectedWorkspace(null); setActiveTab("users"); };
    const showNotifs = () => { setSelectedWorkspace(null); setActiveTab("notifications"); };
    const createWS = () => setShowCreateModal(true);

    window.addEventListener("sidebar-tab-chats", showChats);
    window.addEventListener("sidebar-tab-users", showUsers);
    window.addEventListener("sidebar-tab-notifications", showNotifs);
    window.addEventListener("sidebar-create-server", createWS);

    return () => {
      window.removeEventListener("sidebar-tab-chats", showChats);
      window.removeEventListener("sidebar-tab-users", showUsers);
      window.removeEventListener("sidebar-tab-notifications", showNotifs);
      window.removeEventListener("sidebar-create-server", createWS);
    };
  }, [setActiveTab, setSelectedWorkspace]);

  return (
    <>
      <aside data-context="sidebar" className={`${forceShow ? "flex" : "hidden lg:flex"} flex-col items-center py-5 w-16 h-full bg-base-200 border-r border-base-300 justify-between flex-shrink-0 z-30 select-none transition-colors duration-200`}>
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Chats / Home */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("chats");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
             aria-label="Direct Messages"
             aria-current={activeTab === "chats" && selectedWorkspace === null}
           >
             <span
               className={`absolute left-0 w-1 bg-primary rounded-r-md transition-all duration-300 ${
                 activeTab === "chats" && selectedWorkspace === null
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "chats" && selectedWorkspace === null
                   ? "rounded-xl bg-primary text-primary-content shadow-lg"
                   : "rounded-2xl bg-base-300 text-base-content/50 hover:rounded-xl hover:text-base-content"
               }`}
             >
               <MessageSquare size={22} fill={activeTab === "chats" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Direct Messages</span>
           </button>

          {/* Friends Tab */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("users");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none rounded-xl"
             aria-label="Friends"
             aria-current={activeTab === "users"}
           >
             <span
               className={`absolute left-0 w-1 bg-primary rounded-r-md transition-all duration-300 ${
                 activeTab === "users"
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "users"
                   ? "rounded-xl bg-primary text-primary-content shadow-lg"
                   : "rounded-2xl bg-base-300 text-base-content/50 hover:rounded-xl hover:text-base-content"
               }`}
             >
               <Users size={22} fill={activeTab === "users" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Friends</span>
           </button>

          {/* Notifications Tab */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("notifications");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none rounded-xl"
             aria-label="Notifications"
             aria-current={activeTab === "notifications"}
           >
             <span
               className={`absolute left-0 w-1 bg-primary rounded-r-md transition-all duration-300 ${
                 activeTab === "notifications"
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "notifications"
                   ? "rounded-xl bg-primary text-primary-content shadow-lg"
                   : "rounded-2xl bg-base-300 text-base-content/50 hover:rounded-xl hover:text-base-content"
               }`}
             >
               <Bell size={22} fill={activeTab === "notifications" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Notifications</span>
           </button>

          <div className="w-8 h-[2px] bg-base-300 rounded-full" />

          <div className="flex flex-col gap-3 w-full items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative group flex items-center justify-center w-full focus:outline-none"
            >
              <div className="size-12 border-2 border-dashed border-base-300 hover:border-primary rounded-2xl hover:rounded-xl flex items-center justify-center text-base-content/50 hover:text-primary-content hover:bg-primary transition-all duration-300 cursor-pointer">
                <Plus className="w-5 h-5" />
              </div>
              <span className="absolute left-[70px] px-3 py-1.5 bg-base-100 text-base-content text-xs font-semibold rounded-lg shadow-xl border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">
                Create a Group
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full px-2 mt-auto">
          {authUser && (
            <Link
              to="/profile"
              className="relative rounded-full ring-2 ring-base-300 hover:ring-primary transition-all duration-200 overflow-hidden size-10 flex-shrink-0"
              title="View Profile"
            >
              <Avatar user={authUser} className="size-10" />
            </Link>
          )}

          <Link
            to="/settings"
            className="relative size-10 flex items-center justify-center rounded-xl text-base-content/50 hover:text-base-content hover:bg-base-300 transition-all duration-200 group"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-[70px] bg-base-100 text-base-content text-xs rounded py-1 px-2 border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Settings</span>
          </Link>

          <button
            onClick={logout}
            className="relative size-10 flex items-center justify-center rounded-xl text-error/80 hover:text-error hover:bg-error/10 transition-all duration-200 group"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-[70px] bg-base-100 text-base-content text-xs rounded py-1 px-2 border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Logout</span>
          </button>
        </div>
      </aside>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-base-100 border border-base-300 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-bold text-base-content mb-2">Create Your Group</h2>
            <p className="text-base-content/70 text-sm mb-6">
              Your group is where you and your team communicate. Give it a name and pick a color.
            </p>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div className="space-y-2">
                <label className="label p-0">
                  <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    Group Name
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Pioneers"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="input input-bordered w-full"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="label p-0">
                  <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    Group Color
                  </span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.label}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`size-10 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColor === color.value
                          ? "border-primary scale-110"
                          : "border-base-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    >
                      {selectedColor === color.value && (
                        <div className="size-2 bg-base-100 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarRail;
