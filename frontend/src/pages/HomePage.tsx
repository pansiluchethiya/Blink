import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Link } from "react-router-dom";
import SidebarRail from "../components/SidebarRail";
import ConversationList from "../components/ConversationList";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import WorkspaceChat from "../components/WorkspaceChat";
import StatusUpdateModal from "../components/StatusUpdateModal";
import UsersPanel from "../components/UsersPanel";
import StatusView from "../components/StatusView";
import {
  MessageSquare,
  Disc,
  Settings,
  Users
} from "lucide-react";

const HomePage = () => {
  const { selectedUser, selectedWorkspace, selectedChannelId } = useChatStore();
  const [activeTab, setActiveTab] = useState("chats"); // chats, status, users
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Automatically close mobile drawer when selected user, workspace, or channel changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [selectedUser, selectedWorkspace, selectedChannelId]);

  return (
    <div className="h-[100dvh] bg-base-200 flex flex-col overflow-hidden">
      
      {/* 3-Section Layout */}
      <div className={`flex flex-grow h-full overflow-hidden w-full relative ${(!selectedUser && !selectedWorkspace) ? "pt-16 lg:pt-0" : ""}`}>
        {/* Section 1: SidebarRail (Far Left) - desktop only */}
        <SidebarRail activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Section 2: Contextual Sidebar (Middle) */}
        {/* Full-width on mobile when no chat is selected, hidden when chat/workspace is open */}
        <div
          className={`
            h-full flex-shrink-0 flex flex-col
            ${(selectedUser || selectedWorkspace) ? "hidden lg:flex" : "flex w-full"}
            lg:w-[320px] border-r border-base-300
          `}
        >
          <div className="flex-grow min-h-0 bg-base-100">
            {selectedWorkspace ? (
              <WorkspaceSidebar />
            ) : (
              <>
                {activeTab === "chats" && (
                  <ConversationList onBurgerClick={() => setIsMobileDrawerOpen(true)} />
                )}
                {activeTab === "status" && (
                  <StatusView onAddStatusClick={() => setShowStatusModal(true)} />
                )}
                {activeTab === "users" && (
                  <UsersPanel setActiveTab={setActiveTab} />
                )}
              </>
            )}
          </div>

          {/* Sticky Mobile Bottom Navigation Bar (Hidden when chat is actively open) */}
          {(!selectedUser && !selectedWorkspace) && (
            <nav className="lg:hidden border-t border-base-300 bg-base-100/95 backdrop-blur-md px-6 py-2.5 flex items-center justify-between z-30 select-none pb-safe">
              <button 
                onClick={() => setActiveTab("chats")}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === "chats" ? "text-primary scale-105" : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <MessageSquare size={19} className={activeTab === "chats" ? "fill-current" : ""} />
                <span className="text-[10px] font-bold">Chats</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("users")}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === "users" ? "text-primary scale-105" : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <Users size={19} className={activeTab === "users" ? "fill-current" : ""} />
                <span className="text-[10px] font-bold">Users</span>
              </button>

              <button
                onClick={() => setActiveTab("status")}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === "status" ? "text-primary scale-105" : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <Disc size={19} className={activeTab === "status" ? "fill-current animate-spin-slow" : ""} />
                <span className="text-[10px] font-bold">Status</span>
              </button>

              <Link 
                to="/settings"
                className="flex flex-col items-center gap-1 transition-all text-base-content/60 hover:text-base-content"
              >
                <Settings size={19} />
                <span className="text-[10px] font-bold">Settings</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Section 3: ChatArea (Right Panel) */}
        {/* Full-width on mobile when chat/workspace is selected, hidden on mobile when no chat/workspace is selected */}
        <div
          className={`
            flex-grow h-full min-w-0 flex flex-col
            ${(!selectedUser && !selectedWorkspace) ? "hidden lg:flex" : "flex"}
          `}
        >
          {selectedWorkspace ? (
            <WorkspaceChat onBurgerClick={() => setIsMobileDrawerOpen(true)} />
          ) : !selectedUser ? (
            <NoChatSelected />
          ) : (
            <ChatContainer onBurgerClick={() => setIsMobileDrawerOpen(true)} />
          )}
        </div>
      </div>

      {/* Mobile Drawer (Left Rail + Contextual Sidebar) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex h-full max-w-[320px] w-[80vw] bg-base-100 shadow-2xl border-r border-base-300 animate-in slide-in-from-left duration-200 z-10">
            <SidebarRail activeTab={activeTab} setActiveTab={setActiveTab} forceShow={true} />
            <div className="flex-1 min-w-0 h-full flex flex-col">
              {selectedWorkspace ? (
                <WorkspaceSidebar />
              ) : (
                <div className="flex-grow min-h-0 bg-base-100 flex flex-col h-full">
                  {activeTab === "chats" && (
                    <ConversationList onBurgerClick={() => setIsMobileDrawerOpen(true)} />
                  )}
                  {activeTab === "status" && (
                    <StatusView onAddStatusClick={() => setShowStatusModal(true)} />
                  )}
                  {activeTab === "users" && (
                    <UsersPanel setActiveTab={setActiveTab} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <StatusUpdateModal onClose={() => setShowStatusModal(false)} />
      )}
    </div>
  );
};

export default HomePage;
