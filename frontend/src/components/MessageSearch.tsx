import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Search, X } from "lucide-react";

const MessageSearch = ({ userId, onClose }) => {
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState("all");
  const { searchMessages, searchMessageResults } = useChatStore();

  useEffect(() => {
    if (query.trim().length > 0) {
      searchMessages(userId, query, sender === "all" ? null : sender);
    }
  }, [query, sender, userId, searchMessages]);

  return (
    <div className="bg-base-100 border-b border-base-300 p-4 space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base-content">Search Messages</h3>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-base-200 text-base-content/60 hover:text-base-content/60 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 size-4 text-base-content/60" />
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-base-200 border border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm"
            autoFocus
          />
        </div>

        {/* Filter */}
        <select
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-xl text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 cursor-pointer"
        >
          <option value="all" className="bg-base-100">All messages</option>
          <option value="me" className="bg-base-100">My messages</option>
          <option value="them" className="bg-base-100">Their messages</option>
        </select>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {searchMessageResults.length > 0 ? (
          searchMessageResults.map((msg) => (
            <div
              key={msg._id}
              className="p-2.5 bg-base-200 rounded-xl text-sm truncate hover:bg-base-200 cursor-pointer transition-colors border border-transparent hover:border-base-300"
              title={msg.text}
            >
              <p className="text-[10px] font-semibold text-base-content/60 mb-1">
                {new Date(msg.createdAt).toLocaleDateString()}
              </p>
              <p className="truncate text-base-content/60 font-medium">{msg.text}</p>
            </div>
          ))
        ) : query.trim().length > 0 ? (
          <p className="text-center text-base-content/60 py-4 text-xs font-semibold">No messages found</p>
        ) : (
          <p className="text-center text-base-content/60 py-4 text-xs font-semibold">Type to search...</p>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;
