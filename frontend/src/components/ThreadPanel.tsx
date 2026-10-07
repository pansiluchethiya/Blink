import { useChatStore } from "../../store/useChatStore";
import { X, Send, Paperclip } from "lucide-react";
import { useState } from "react";

const ThreadPanel = ({ message, onClose }) => {
  const { threadMessages, replyInThread } = useChatStore();
  const messages = threadMessages[message._id] || [];
  const [text, setText] = useState("");

  const handleReply = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await replyInThread(message._id, text);
    setText("");
  };

  return (
    <div className="w-80 h-full bg-base-200 border-l border-base-300 flex flex-col z-40">
      <div className="h-16 px-4 border-b border-base-300 flex items-center justify-between">
        <h3 className="font-bold text-base-content">Thread</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-base-content/60" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-base-300 p-3 rounded-lg text-sm text-base-content">{message.text}</div>
        {messages.map((msg) => (
          <div key={msg._id} className="text-sm text-base-content">
            <span className="font-bold text-base-content">{msg.senderId?.fullName}: </span>
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="p-3 border-t border-base-300 flex gap-2">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          className="flex-grow bg-base-300 text-base-content rounded-lg p-2 text-sm"
          placeholder="Reply..."
        />
        <button type="submit" className="bg-primary text-base-content p-2 rounded-lg"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};

export default ThreadPanel;
