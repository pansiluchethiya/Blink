import { formatDistanceToNow } from "../lib/utils";
import { MessageSquare, UserPlus, Heart, Bell, Trash2 } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import { Avatar } from "./ui/BlinkComponents";

const NotificationItem = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotificationStore();
  const { setSelectedUser, users } = useChatStore();
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case "direct_message":
      case "group_message":
        return <MessageSquare className="size-3 text-primary" />;
      case "friend_request":
      case "friend_accept":
        return <UserPlus className="size-3 text-primary" />;
      case "reaction":
        return <Heart className="size-3 text-rose-500" fill="currentColor" />;
      default:
        return <Bell className="size-3 text-primary" />;
    }
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.metadata?.conversationId) {
      const user = users.find(u => u._id === notification.metadata.conversationId);
      if (user) {
        setSelectedUser(user);
        navigate("/");
      }
    }
  };

  return (
    <div
      className={`group px-3 py-3 mx-2 rounded-2xl flex gap-3 transition-all duration-200 cursor-pointer relative ${
        !notification.isRead ? "bg-primary/5 shadow-soft" : "hover:bg-base-200"
      }`}
      onClick={handleClick}
    >
      <div className="relative">
        <Avatar src={notification.actor?.profilePic} size="md" />
        <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1 border border-border shadow-soft">
          {getIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <p className={`text-sm leading-tight ${!notification.isRead ? "font-bold text-base-content" : "font-semibold text-base-content/60"}`}>
            {notification.title}
          </p>
          <span className="text-[10px] text-base-content/60 font-medium whitespace-nowrap pt-0.5">
            {formatDistanceToNow(new Date(notification.createdAt))}
          </span>
        </div>
        <p className="text-xs text-base-content/60 line-clamp-2">
          {notification.body}
        </p>
      </div>

      <button
        type="button"
        onClick={async (event) => {
          event.stopPropagation();
          await deleteNotification(notification._id);
        }}
        className="absolute right-3 top-3 text-base-content/60 hover:text-rose-500"
        title="Delete notification"
      >
        <Trash2 className="size-4" />
      </button>
      {!notification.isRead && (
        <div className="size-2 rounded-full bg-primary absolute right-3 top-1/2 -translate-y-1/2 shadow-soft" />
      )}
    </div>
  );
};

export default NotificationItem;
