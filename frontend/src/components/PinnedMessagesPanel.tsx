import { useChatStore } from "../store/useChatStore";
import { Pin } from "lucide-react";

const PinnedMessagesPanel = ({ channelId }) => {
  const { workspaceMessages, togglePinWorkspaceMessage } = useChatStore();
  const messages = workspaceMessages[channelId] || [];
  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-base-200 border-b border-base-300 p-3">
      <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Pin className="w-3.5 h-3.5" />
        Pinned Messages ({pinnedMessages.length})
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
        {pinnedMessages.map((msg) => (
          <div key={msg._id} className="bg-base-300/50 p-2 rounded-lg flex items-start justify-between gap-2">
            <p className="text-xs text-base-content truncate">{msg.text || "📎 Attachment"}</p>
            <button
              onClick={() => togglePinWorkspaceMessage(msg._id)}
              className="text-base-content/60 hover:text-error"
              title="Unpin message"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;
