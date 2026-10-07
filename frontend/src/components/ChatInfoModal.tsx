import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from './Avatar';

const ChatInfoModal = ({ open, onClose, user, chatSettings }) => {
  const [portalRoot, setPortalRoot] = useState(null);

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
    return () => window.removeEventListener("close-active-modal", handleClose);
  }, [open, user, onClose]);

  if (!open || !user || !portalRoot) return null;

  return createPortal(
    <div
      data-context="modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-base-200/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-base-300 bg-base-100 shadow-2xl overflow-hidden max-h-[90vh] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-base-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-base-content">Conversation Info</h2>
            <p className="text-xs text-base-content/60 mt-0.5">{user.fullName || user.name}</p>
          </div>
          <button className="px-3.5 py-1.5 bg-base-200 hover:bg-base-200 text-base-content/60 text-xs rounded-xl font-semibold transition-all active:scale-[0.98] self-start sm:self-auto" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar user={user} className="size-20 border border-base-300 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-base-content text-lg truncate">{user.fullName || user.name}</div>
              <div className="text-xs text-base-content/60 font-semibold truncate">{user.email || 'No email available'}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Settings</h4>
            <div className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
              <div className="p-3.5 rounded-xl border border-base-300 bg-base-200 text-base-content font-bold text-xs uppercase tracking-wider">
                Disappearing: <span className="text-primary ml-1 font-bold">{chatSettings?.expiryLabel || 'Off'}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-base-300 bg-base-200 text-base-content font-bold text-xs uppercase tracking-wider">
                Locked: <span className="text-primary ml-1 font-bold">{chatSettings?.isLocked ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default ChatInfoModal;
