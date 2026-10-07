import { X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const EditingIndicator = () => {
  const { editingMessageId, messages, setEditingMessage } = useChatStore();

  if (!editingMessageId) return null;

  const editingMessage = messages.find((m) => m._id === editingMessageId);

  if (!editingMessage) return null;

  return (
    <div className="bg-base-200 border-l-2 border-primary p-3 mb-2 flex items-center justify-between rounded-xl">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-primary font-bold text-xs uppercase tracking-wider flex-shrink-0">Editing:</span>
        <p className="text-sm text-base-content/70 truncate">{editingMessage.text}</p>
      </div>
      <button
        onClick={() => setEditingMessage(null)}
        className="p-1 rounded-lg hover:bg-base-300 text-base-content/50 hover:text-base-content transition-colors flex-shrink-0"
        title="Cancel edit"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default EditingIndicator;
