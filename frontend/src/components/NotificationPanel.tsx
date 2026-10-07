import { useEffect, useState } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import NotificationItem from "./NotificationItem";
import { Bell, CheckCircle } from "lucide-react";

const NotificationPanel = () => {
  const {
    notifications,
    getNotifications,
    markAllAsRead,
    clearReadNotifications,
    isNotificationsLoading,
    loadMoreNotifications,
    hasMore,
  } = useNotificationStore();
  
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    getNotifications(unreadOnly);
  }, [unreadOnly, getNotifications]);

  return (
    <div className="flex flex-col h-full glass transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0 gap-3">
        <div>
          <h1 className="text-xl font-bold text-base-content">Notifications</h1>
          <p className="text-xs text-base-content/60">Manage recent alerts and clear read items.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-2xl bg-base-200 text-base-content/60 text-xs font-semibold hover:bg-base-200 transition"
            onClick={clearReadNotifications}
            title="Clear all read notifications"
            disabled={!notifications.some((n) => n.isRead)}
          >
            Clear read
          </button>
          <button
            className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors"
            onClick={markAllAsRead}
            title="Mark all as read"
          >
            <CheckCircle size={20} />
          </button>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex gap-2 px-5 mb-4 flex-shrink-0">
        <button
          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${
            !unreadOnly 
              ? "bg-primary text-base-content shadow-soft" 
              : "bg-base-200 text-base-content/60 hover:bg-base-200"
          }`}
          onClick={() => setUnreadOnly(false)}
        >
          All
        </button>
        <button
          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${
            unreadOnly 
              ? "bg-primary text-base-content shadow-soft" 
              : "bg-base-200 text-base-content/60 hover:bg-base-200"
          }`}
          onClick={() => setUnreadOnly(true)}
        >
          Unread
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pt-2">
        {notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="size-16 rounded-full bg-base-200 flex items-center justify-center mb-2">
              <Bell className="size-8 text-base-content" />
            </div>
            <p className="text-base-content/60 font-semibold">No notifications yet</p>
            <p className="text-base-content/60 text-xs">Stay tuned for updates!</p>
          </div>
        ) : (
          <div className="px-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
              />
            ))}
            {hasMore && (
              <div className="p-6 text-center">
                <button
                  className="px-6 py-2 bg-background border border-border text-primary text-xs rounded-xl font-bold hover:shadow-soft transition-all active:scale-95"
                  onClick={() => loadMoreNotifications(unreadOnly)}
                  disabled={isNotificationsLoading}
                >
                  {isNotificationsLoading ? "Loading..." : "Load more notifications"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
