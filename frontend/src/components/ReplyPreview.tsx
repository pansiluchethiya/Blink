import { X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ReplyPreview = () => {
  const { replyingToMessage, setReplyingToMessage } = useChatStore();

  if (!replyingToMessage) return null;

  return (
    <div className="px-4 py-2 mb-2 bg-base-200 border-l-2 border-primary rounded-xl flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold">Replying to message</p>
        <p className="text-sm truncate text-base-content">
          {replyingToMessage.text || "[Image/File]"}
        </p>
      </div>
      <button
        onClick={() => setReplyingToMessage(null)}
        className="p-1 rounded-lg hover:bg-base-300 text-base-content/50 hover:text-base-content transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default ReplyPreview;
