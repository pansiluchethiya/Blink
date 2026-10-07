import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, Settings, User, MessageCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import StatusUpdateModal from "./StatusUpdateModal";
import NotificationBell from "./NotificationBell";


const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const openStatus = () => setShowStatusModal(true);
    window.addEventListener("navbar-status-modal", openStatus);
    return () => window.removeEventListener("navbar-status-modal", openStatus);
  }, []);

  return (
    <>
      {showStatusModal && (
        <StatusUpdateModal onClose={() => setShowStatusModal(false)} />
      )}
      
      <header
        data-context="navbar"
        className="glass border-b border-border fixed w-full top-0 z-40 backdrop-blur-md transition-colors duration-200"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img src="/blink.svg" alt="Blink Logo" className="w-5 h-5 object-contain" />
                </div>
                <h1 className="text-lg font-bold text-base-content">Blink</h1>
              </Link>
            </div>


            <div className="flex items-center gap-2.5">
              {authUser && (
                <>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="px-4 py-2 bg-base-200 hover:bg-base-200 text-base-content/60 text-sm rounded-xl font-medium flex items-center gap-2 shadow-soft transition-all active:scale-[0.98]"
                    title="Update status"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Status</span>
                  </button>

                  <NotificationBell />
                </>
              )}
              
              <Link
                to={"/settings"}
                className="px-4 py-2 bg-base-200 hover:bg-base-200 text-base-content/60 text-sm rounded-xl font-medium flex items-center gap-2 shadow-soft transition-all active:scale-[0.98]"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {/* Mobile search button: dispatch event to focus sidebar search */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('openChatSearch'))}
                className="p-2 rounded-xl text-base-content/60 hover:bg-base-200 sm:hidden"
                title="Search chats"
              >
                <Search size={18} />
              </button>

              {authUser && (
                <>
                  <Link 
                    to={"/profile"} 
                    className="px-4 py-2 bg-base-200 hover:bg-base-200 text-base-content/60 text-sm rounded-xl font-medium flex items-center gap-2 shadow-soft transition-all active:scale-[0.98]"
                  >
                    <User className="size-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>

                  <button 
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2 transition-all active:scale-[0.98]" 
                    onClick={logout}
                  >
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
export default Navbar;

