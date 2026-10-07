import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Heart,
  MessageCircle,
  Copy,
  Edit,
  Trash2,
  Pin,
  Share2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ForwardModal from "./ForwardModal";

const MessageActions = ({ message, onClose }) => {
  const { authUser } = useAuthStore();
  const {
    addReaction,
    removeReaction,
    deleteMessage,
    togglePinMessage,
    setEditingMessage,
    setReplyingToMessage,
  } = useChatStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  if (!message) return null;

  const isOwn = message.senderId === authUser._id;

  const emojis = ["👍", "❤️", "😂", "😲", "😢", "😡", "🔥", "✨"];

  const handleReaction = (emoji) => {
    const hasReaction = message.reactions?.[emoji]?.includes(authUser._id);
    if (hasReaction) {
      removeReaction(message._id, emoji);
    } else {
      addReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      toast.success("Copied to clipboard");
      onClose();
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const handleEdit = () => {
    setEditingMessage(message._id);
    onClose();
  };

  const handleReply = () => {
    setReplyingToMessage(message);
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Delete this message?")) {
      deleteMessage(message._id, false);
      onClose();
    }
  };

  const handlePin = () => {
    togglePinMessage(message._id);
    toast.success(message.isPinned ? "Message unpinned" : "Message pinned");
    onClose();
  };

  const handleForward = () => {
    setShowForwardModal(true);
  };

  // If forward modal is open, render it instead
  if (showForwardModal) {
    return (
      <ForwardModal
        messageId={message._id}
        onClose={() => {
          setShowForwardModal(false);
          onClose?.();
        }}
      />
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-elevated p-0 min-w-[200px] z-50 text-base-content max-sm:pb-4">
      {/* Visual indicator drag handle for mobile bottom sheet */}
      <div className="hidden max-sm:block w-12 h-1.5 bg-base-200 rounded-full mx-auto my-3" />

      {/* Emoji reactions */}
      {!showEmojiPicker && (
        <button
          onClick={() => setShowEmojiPicker(true)}
          className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm max-sm:text-base max-sm:py-3"
        >
          <Heart size={16} />
          React
        </button>
      )}

      {showEmojiPicker && (
        <div className="p-3 border-b border-border">
          <div className="grid grid-cols-8 gap-1 max-sm:gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xl hover:bg-base-200 p-2 rounded transition-colors max-sm:text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleReply}
        className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm border-t border-border max-sm:text-base max-sm:py-3"
      >
        <MessageCircle size={16} />
        Reply
      </button>

      {message.text && (
        <button
          onClick={handleCopy}
          className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm border-t border-border max-sm:text-base max-sm:py-3"
        >
          <Copy size={16} />
          Copy
        </button>
      )}

      <button
        onClick={handlePin}
        className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm border-t border-border max-sm:text-base max-sm:py-3"
      >
        <Pin size={16} />
        {message.isPinned ? "Unpin" : "Pin"}
      </button>

      <button
        onClick={handleForward}
        className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm border-t border-border max-sm:text-base max-sm:py-3"
      >
        <Share2 size={16} />
        Forward
      </button>

      {isOwn && (
        <>
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm border-t border-border max-sm:text-base max-sm:py-3"
          >
            <Edit size={16} />
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm text-danger border-t border-border max-sm:text-base max-sm:py-3"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default MessageActions;
