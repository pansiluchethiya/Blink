import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Search, User, Hash, Zap, X, Command } from "lucide-react";
import Avatar from "./Avatar";

const CommandPalette = () => {
  const { 
    isCommandPaletteOpen, 
    setCommandPaletteOpen, 
    users, 
    workspaces, 
    setSelectedUser, 
    setSelectedWorkspace 
  } = useChatStore();
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const items = [
    ...filteredUsers.map(u => ({ type: 'user', data: u })),
    ...filteredWorkspaces.map(w => ({ type: 'workspace', data: w }))
  ];

  const handleSelect = (item) => {
    if (item.type === 'user') {
      setSelectedUser(item.data);
    } else {
      setSelectedWorkspace(item.data);
    }
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault();
      handleSelect(items[selectedIndex]);
    } else if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

  useEffect(() => {
    const activeItem = scrollRef.current?.children[selectedIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
      <div 
        className="fixed inset-0 bg-base-200/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={() => setCommandPaletteOpen(false)}
      />
      
      <div className="w-full max-w-[600px] bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        <div className="relative flex items-center px-4 py-4 border-b border-base-300">
          <Search className="size-5 text-base-content/60 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for people, workspaces, or commands..."
            className="flex-1 bg-transparent border-none outline-none text-[16px] text-base-content placeholder:text-base-content/60"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-base-200 border border-base-300">
            <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest">Esc</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2" ref={scrollRef}>
          {items.length > 0 ? (
            <>
              {filteredUsers.length > 0 && (
                <div className="px-4 py-2">
                  <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-widest">People</span>
                </div>
              )}
              {filteredUsers.map((user, idx) => (
                <button
                  key={user._id}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    items.indexOf(items.find(i => i.data === user)) === selectedIndex 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-base-200 text-base-content/60"
                  }`}
                  onClick={() => handleSelect({ type: 'user', data: user })}
                  onMouseEnter={() => setSelectedIndex(items.indexOf(items.find(i => i.data === user)))}
                >
                  <div className="size-8 rounded-full overflow-hidden bg-base-200">
                    <Avatar user={user} className="size-full" />
                  </div>
                  <span className="font-medium">{user.fullName}</span>
                </button>
              ))}

              {filteredWorkspaces.length > 0 && (
                <div className="px-4 py-2 mt-2 border-t border-base-300 pt-4">
                  <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-widest">Workspaces</span>
                </div>
              )}
              {filteredWorkspaces.map((ws, idx) => (
                <button
                  key={ws._id}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    items.indexOf(items.find(i => i.data === ws)) === selectedIndex 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-base-200 text-base-content/60"
                  }`}
                  onClick={() => handleSelect({ type: 'workspace', data: ws })}
                  onMouseEnter={() => setSelectedIndex(items.indexOf(items.find(i => i.data === ws)))}
                >
                  <div className="size-8 rounded-lg bg-base-200 from-primary/20 to-primary/10 flex items-center justify-center text-primary">
                    <Hash size={18} />
                  </div>
                  <span className="font-medium">{ws.name}</span>
                </button>
              ))}
            </>
          ) : (
            <div className="py-12 px-4 text-center">
              <div className="size-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-3">
                <Search className="size-6 text-base-content" />
              </div>
              <p className="text-base-content/60 text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-base-200 border-t border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center size-5 rounded bg-base-100 border border-base-300 shadow-sm">
                <span className="text-[10px] text-base-content/60">↑</span>
              </div>
              <div className="flex items-center justify-center size-5 rounded bg-base-100 border border-base-300 shadow-sm">
                <span className="text-[10px] text-base-content/60">↓</span>
              </div>
              <span className="text-[11px] text-base-content/60">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center px-1.5 h-5 rounded bg-base-100 border border-base-300 shadow-sm">
                <span className="text-[10px] text-base-content/60">Enter</span>
              </div>
              <span className="text-[11px] text-base-content/60">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-base-content/60">
            <Zap size={14} className="fill-current" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Quick Actions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
