import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Avatar from "./Avatar";
import {
  Settings,
  LogOut,
  Plus,
  Users,
  Bell,
  MessageSquare,
  NotebookPen,
  Zap,
} from "lucide-react";

const SidebarRail = ({ activeTab = "chats", setActiveTab = () => {}, forceShow = false }) => {
  const { logout, authUser } = useAuthStore();
  const { setSelectedWorkspace, createWorkspace } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();

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

  const goChats = () => {
    setSelectedWorkspace(null);
    setActiveTab("chats");
    navigate("/");
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

  const onHome = location.pathname === "/";
  const items = [
    {
      key: "chats",
      label: "Chats",
      icon: MessageSquare,
      active: onHome && activeTab === "chats",
      onClick: goChats,
    },
    {
      key: "users",
      label: "Friends",
      icon: Users,
      active: onHome && activeTab === "users",
      onClick: () => {
        setSelectedWorkspace(null);
        setActiveTab("users");
        navigate("/");
      },
    },
    {
      key: "notes",
      label: "Notes",
      icon: NotebookPen,
      active: location.pathname === "/notes",
      onClick: () => navigate("/notes"),
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      active: onHome && activeTab === "notifications",
      onClick: () => {
        setSelectedWorkspace(null);
        setActiveTab("notifications");
        navigate("/");
      },
    },
  ];

  return (
    <>
      <aside data-context="sidebar" className={`${forceShow ? "flex" : "hidden lg:flex"} flex-col items-center py-5 w-[80px] h-full bg-base-100 md:rounded-[28px] justify-between flex-shrink-0 z-30 select-none transition-colors duration-200`}>
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Logo */}
          <button
            onClick={goChats}
            className="size-11 rounded-full bg-base-content text-base-100 flex items-center justify-center hover:scale-105 transition-transform mb-2"
            aria-label="Blink home"
            title="Blink"
          >
            <Zap size={20} className="fill-current" />
          </button>

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className="relative group flex items-center justify-center w-full focus:outline-none focus-visible rounded-2xl"
                aria-label={item.label}
                aria-current={item.active}
                title={item.label}
              >
                <div
                  className={`size-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    item.active
                      ? "rounded-full bg-base-content text-base-100 shadow-md"
                      : "rounded-2xl text-base-content/40 hover:bg-base-200 hover:text-base-content"
                  }`}
                >
                  <Icon size={22} fill={item.active ? "currentColor" : "none"} aria-hidden="true" />
                </div>
                <span className="absolute left-[70px] px-3 py-1.5 bg-base-100 text-base-content text-xs font-semibold rounded-lg shadow-xl border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            );
          })}

          <div className="w-8 h-[2px] bg-base-300 rounded-full my-1" />

          <button
            onClick={() => setShowCreateModal(true)}
            className="relative group flex items-center justify-center w-full focus:outline-none"
            aria-label="Create a Group"
            title="Create a Group"
          >
            <div className="size-12 border-2 border-dashed border-base-300 hover:border-primary rounded-2xl flex items-center justify-center text-base-content/50 hover:text-primary transition-all duration-200 cursor-pointer">
              <Plus className="w-5 h-5" />
            </div>
            <span className="absolute left-[70px] px-3 py-1.5 bg-base-100 text-base-content text-xs font-semibold rounded-lg shadow-xl border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">
              Create a Group
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-2.5 w-full px-2 mt-auto">
          <Link
            to="/settings"
            className={`relative size-12 flex items-center justify-center rounded-2xl transition-all duration-200 group ${
              location.pathname === "/settings"
                ? "bg-base-content text-base-100 rounded-full"
                : "text-base-content/40 hover:text-base-content hover:bg-base-200"
            }`}
            title="Settings"
          >
            <Settings className="w-[22px] h-[22px]" />
            <span className="absolute left-[62px] bg-base-100 text-base-content text-xs rounded py-1 px-2 border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Settings</span>
          </Link>

          <button
            onClick={logout}
            className="relative size-12 flex items-center justify-center rounded-2xl text-base-content/40 hover:text-error hover:bg-error/10 transition-all duration-200 group"
            title="Logout"
          >
            <LogOut className="w-[22px] h-[22px]" />
            <span className="absolute left-[62px] bg-base-100 text-base-content text-xs rounded py-1 px-2 border border-base-300 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Logout</span>
          </button>

          {authUser && (
            <Link
              to="/profile"
              className="relative rounded-full ring-2 ring-base-300 hover:ring-primary transition-all duration-200 overflow-hidden size-11 flex-shrink-0 mt-1"
              title="View Profile"
            >
              <Avatar user={authUser} className="size-11" />
            </Link>
          )}
        </div>
      </aside>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
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
                  className="input input-bordered w-full rounded-2xl"
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
                  className="btn btn-ghost rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-full"
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
