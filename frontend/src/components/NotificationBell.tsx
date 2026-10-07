import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";
import NotificationPanel from "./NotificationPanel";

const NotificationBell = ({ hideText = false, dropdownClass = "right-0 mt-2 origin-top-right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, getUnreadCount, subscribeToNotifications, unsubscribeFromNotifications } = useNotificationStore();
  const { authUser, socket } = useAuthStore();
  const bellRef = useRef(null);

  useEffect(() => {
    if (authUser && socket) {
      getUnreadCount();
      subscribeToNotifications();
    }
    return () => {
      if (socket) unsubscribeFromNotifications();
    };
  }, [authUser, socket, getUnreadCount, subscribeToNotifications, unsubscribeFromNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        className={hideText 
          ? `size-10 flex items-center justify-center rounded-xl bg-base-200/50 hover:bg-base-200 text-base-content/60 transition-all duration-200 active:scale-95 ${unreadCount > 0 ? "text-primary" : ""}`
          : `px-3 py-1.5 bg-base-200 hover:bg-base-200 text-base-content/60 text-sm rounded-xl font-medium flex items-center gap-2 transition-all active:scale-[0.98] ${unreadCount > 0 ? "text-primary" : ""}`
        }
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-base-content text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {!hideText && <span className="hidden sm:inline">Notifications</span>}
      </button>

      {isOpen && (
        <div className={`absolute z-50 animate-in fade-in zoom-in duration-200 ${dropdownClass}`}>
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
