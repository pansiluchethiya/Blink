import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const MessageReactions = ({ message }) => {
  const { authUser } = useAuthStore();
  const { addReaction, removeReaction } = useChatStore();

  if (!message || !message.reactions || typeof message.reactions !== 'object') {
    return null;
  }

  const reactionsKeys = Object.keys(message.reactions);
  if (reactionsKeys.length === 0) {
    return null;
  }

  const handleReactionClick = (emoji) => {
    try {
      const hasReaction = message.reactions[emoji]?.includes(authUser._id);
      if (hasReaction) {
        removeReaction(message._id, emoji);
      } else {
        addReaction(message._id, emoji);
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
      // Optionally show a toast or handle the error
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {reactionsKeys.map((emoji) => {
        try {
          const users = message.reactions[emoji];
          if (!Array.isArray(users)) return null;

          const hasReaction = users?.includes(authUser._id);
          return (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                ${
                  hasReaction
                    ? "bg-primary text-primary-content border border-primary"
                    : "bg-base-200 hover:bg-base-300 border border-base-300 text-base-content"
                }
              `}
              title={users?.map(id => id.substring(0, 4)).join(", ")}
            >
              {emoji}
              {users && users.length > 0 && (
                <span className="text-xs">{users.length > 1 ? users.length : ""}</span>
              )}
            </button>
          );
        } catch (error) {
          console.error("Error rendering reaction:", emoji, error);
          return null;
        }
      })}
    </div>
  );
};

export default MessageReactions;
