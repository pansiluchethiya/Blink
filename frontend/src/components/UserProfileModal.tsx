import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Search, Bell, BellOff, X, FileText } from 'lucide-react';
import Avatar from './Avatar';

const UserProfileModal = ({ open, onClose, user }) => {
  const [portalRoot, setPortalRoot] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    setPortalRoot(element);

    return () => {
      document.body.removeChild(element);
    };
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    const handleClose = () => onClose();
    window.addEventListener("close-active-modal", handleClose);
    return () => {
      window.removeEventListener("close-active-modal", handleClose);
    };
  }, [open, user, onClose]);

  if (!open || !user || !portalRoot) return null;

  return createPortal(
    <div data-context="modal" className="fixed inset-0 z-[9999] flex items-center justify-center bg-base-300/70 backdrop-blur-md p-4 transition-all duration-200">
      <div className="w-full max-w-md rounded-[32px] border border-base-300 bg-base-100 shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] flex flex-col">
        
        {/* Top bar with back/close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 flex-shrink-0">
          <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">
            Contact Details
          </span>
          <button 
            className="p-1.5 bg-base-200 hover:bg-base-200 text-base-content/60 hover:text-base-content/60 rounded-xl transition-all" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto scrollbar-none">
          
          {/* Centered Avatar and Name Block */}
          <div className="flex flex-col items-center justify-center pt-8 pb-5 px-6 select-none">
            <div className="size-24 rounded-full border-4 border-base-300 shadow-sm overflow-hidden">
              <Avatar user={user} className="w-full h-full" />
            </div>
            <h3 className="font-extrabold text-xl text-base-content mt-4 leading-tight">
              {user.fullName || user.name}
            </h3>
            <p className="text-xs text-base-content/60 mt-1.5 font-bold">
              {user.email || "Active Now"}
            </p>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-4 gap-2.5 px-6 mb-6">
            <button className="flex flex-col items-center justify-center p-3 bg-base-200 border border-base-300 rounded-2xl hover:scale-105 active:scale-95 transition-all text-base-content/60">
              <Phone size={18} />
              <span className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wider text-base-content/60">Call</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-base-200 border border-base-300 rounded-2xl hover:scale-105 active:scale-95 transition-all text-base-content/60">
              <Video size={18} />
              <span className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wider text-base-content/60">Video</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-base-200 border border-base-300 rounded-2xl hover:scale-105 active:scale-95 transition-all text-base-content/60">
              <Search size={18} />
              <span className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wider text-base-content/60">Search</span>
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center justify-center p-3 bg-base-200 border border-base-300 rounded-2xl hover:scale-105 active:scale-95 transition-all text-base-content/60"
            >
              {isMuted ? <BellOff size={18} className="text-rose-500" /> : <Bell size={18} />}
              <span className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wider text-base-content/60">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>
          </div>

          {/* Media, Links & Files Section */}
          <div className="px-6 mb-6">
            <h4 className="text-[11px] font-bold text-base-content/60 uppercase tracking-widest mb-3">
              Media, Links & Files
            </h4>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="aspect-square rounded-2xl bg-base-200 border border-base-300 overflow-hidden shadow-sm hover:scale-[1.03] transition-all">
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120" className="w-full h-full object-cover" alt="Media" />
              </div>
              <div className="aspect-square rounded-2xl bg-base-200 border border-base-300 flex flex-col items-center justify-center p-1.5 shadow-sm text-center hover:scale-[1.03] transition-all">
                <FileText size={18} className="text-primary mb-1" />
                <span className="text-[8px] font-extrabold text-base-content/60 truncate w-full">project.pdf</span>
              </div>
              <div className="aspect-square rounded-2xl bg-base-200 border border-base-300 overflow-hidden shadow-sm hover:scale-[1.03] transition-all">
                <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=120" className="w-full h-full object-cover" alt="Media" />
              </div>
              <div className="aspect-square rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center font-extrabold text-xs text-base-content/60 shadow-sm hover:scale-[1.03] transition-all select-none">
                +12
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 pb-6">
            <h4 className="text-[11px] font-bold text-base-content/60 uppercase tracking-widest mb-3">
              Profile Details
            </h4>
            <div className="space-y-3">
              <div className="p-3.5 bg-base-200/50 border border-base-300 rounded-2xl">
                <p className="text-[9px] font-bold text-base-content/60 uppercase tracking-wider">About</p>
                <p className="text-xs font-bold text-base-content mt-1 leading-relaxed">
                  {user.about || 'Hey there! I am using Blink.'}
                </p>
              </div>
              <div className="p-3.5 bg-base-200/50 border border-base-300 rounded-2xl">
                <p className="text-[9px] font-bold text-base-content/60 uppercase tracking-wider">Joined Blink</p>
                <p className="text-xs font-bold text-base-content mt-1">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'Recently'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default UserProfileModal;

