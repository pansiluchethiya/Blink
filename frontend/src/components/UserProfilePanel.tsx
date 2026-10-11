import { useEffect, useState } from 'react';
import { X, ArrowLeft, Bell, Pin, Lock, MessageSquare, Image as ImageIcon, FileText, Link as LinkIcon, Loader } from 'lucide-react';
import Avatar from './Avatar';
import ChatLockModal from './ChatLockModal';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { getUserHandle } from '../lib/utils';

interface MediaItem {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
}

interface MediaResponse {
  images: MediaItem[];
  videos: MediaItem[];
  files: MediaItem[];
  links: MediaItem[];
}

/**
 * Contact profile screen (mobile UI v3 reference): big avatar, live stat
 * cards, media grid, and real settings rows (mute / pin / lock all hit
 * the server). Full-screen on mobile, right-side panel on desktop.
 */
const UserProfilePanel = ({ user, onClose, isOpen }) => {
  const { setLightboxImage, toggleMuteChat, togglePinChat, lockChat, unlockChat } = useChatStore();
  const { authUser } = useAuthStore();
  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [lockModal, setLockModal] = useState<null | "set" | "unlock">(null);
  const [newPin, setNewPin] = useState("");

  const userId = user?._id;

  useEffect(() => {
    if (!userId || !isOpen) return;
    let cancelled = false;
    setLoadingMedia(true);
    setMedia(null);
    axiosInstance
      .get(`/messages/media/${userId}`)
      .then((res) => { if (!cancelled) setMedia(res.data); })
      .catch(() => { if (!cancelled) setMedia({ images: [], videos: [], files: [], links: [] }); })
      .finally(() => { if (!cancelled) setLoadingMedia(false); });
    return () => { cancelled = true; };
  }, [userId, isOpen]);

  if (!user || !isOpen) return null;

  const isMuted = authUser?.mutedChats?.includes(userId);
  const isPinned = authUser?.pinnedChats?.includes(userId);
  const isLocked = authUser?.lockedChats?.includes(userId);

  const photos = [...(media?.images ?? []), ...(media?.videos ?? [])];
  const files = media?.files ?? [];
  const links = media?.links ?? [];
  const gridPhotos = photos.slice(0, 6);
  const extraCount = photos.length - gridPhotos.length;

  const stats = [
    { icon: ImageIcon, label: "Photos", count: photos.length },
    { icon: FileText, label: "Files", count: files.length },
    { icon: LinkIcon, label: "Links", count: links.length },
  ];

  const doLock = async () => {
    if (newPin.length < 4) return;
    await lockChat(userId, newPin);
    setNewPin("");
    setLockModal(null);
  };

  const doUnlock = async (_chat: unknown, pin: string) => {
    const ok = await unlockChat(userId, pin);
    if (ok) setLockModal(null);
  };

  return (
    <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto z-[100] w-full md:w-[380px] bg-base-100 md:border-l md:border-base-200 md:shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <button onClick={onClose} className="md:hidden p-2 -ml-2 hover:bg-base-200 rounded-full transition-colors" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1" />
        <button onClick={onClose} className="hidden md:inline-flex p-2 rounded-xl hover:bg-base-200 text-base-content/60 transition-colors" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-8">
        {/* Identity */}
        <div className="flex flex-col items-center px-6 pt-2">
          <Avatar user={user} className="size-24 md:size-28 border-4 border-base-200 shadow-lg" />
          <h1 className="text-xl font-bold text-base-content mt-3 text-center">{user.fullName}</h1>
          <p className="text-primary text-sm font-semibold mt-0.5">{getUserHandle(user) || user.email}</p>
          {user.bio && (
            <p className="text-base-content/50 text-[13px] text-center mt-1.5 max-w-[260px]">{user.bio}</p>
          )}
          <button
            onClick={onClose}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-content rounded-full font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            <MessageSquare size={16} />
            Message
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2.5 px-4 mt-6">
          {stats.map(({ icon: Icon, label, count }) => (
            <div key={label} className="bg-base-200/70 rounded-2xl py-3.5 flex flex-col items-center gap-1">
              <Icon size={18} className="text-primary" />
              <span className="text-lg font-bold text-base-content leading-none">{loadingMedia ? "–" : count}</span>
              <span className="text-[11px] font-semibold text-base-content/50">{label}</span>
            </div>
          ))}
        </div>

        {/* Media grid */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold text-base-content">
              Media and photos {photos.length > 0 && <span className="text-primary">(+{photos.length})</span>}
            </h2>
          </div>
          {loadingMedia ? (
            <div className="flex justify-center py-8"><Loader size={22} className="animate-spin text-primary" /></div>
          ) : gridPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {gridPhotos.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxImage(item.url)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-base-200 active:scale-95 transition-all"
                >
                  <img src={item.url} alt="" className="size-full object-cover" loading="lazy" />
                  {i === gridPhotos.length - 1 && extraCount > 0 && (
                    <span className="absolute inset-0 bg-black/55 text-white text-lg font-bold flex items-center justify-center">
                      +{extraCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-base-content/40">
              <ImageIcon size={26} className="mb-2 opacity-50" />
              <span className="text-xs font-semibold">No shared media yet</span>
            </div>
          )}
        </div>

        {/* Settings rows */}
        <div className="px-4 mt-6 space-y-1">
          <button
            onClick={() => toggleMuteChat(userId)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-200/70 transition-colors text-left"
          >
            <span className="size-9 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
              <Bell size={17} className="text-base-content/70" />
            </span>
            <span className="flex-1 text-[15px] font-medium text-base-content">Notifications</span>
            <span className={`w-11 h-[26px] rounded-full p-1 transition-colors flex flex-shrink-0 ${isMuted ? "bg-base-300 justify-start" : "bg-primary justify-end"}`}>
              <span className="size-[18px] rounded-full bg-white shadow" />
            </span>
          </button>

          <button
            onClick={() => togglePinChat(userId)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-200/70 transition-colors text-left"
          >
            <span className="size-9 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
              <Pin size={17} className="text-base-content/70" />
            </span>
            <span className="flex-1 text-[15px] font-medium text-base-content">Pin chat</span>
            <span className={`text-[13px] font-semibold ${isPinned ? "text-primary" : "text-base-content/40"}`}>
              {isPinned ? "Pinned" : "Off"}
            </span>
          </button>

          <button
            onClick={() => setLockModal(isLocked ? "unlock" : "set")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-base-200/70 transition-colors text-left"
          >
            <span className="size-9 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
              <Lock size={17} className="text-base-content/70" />
            </span>
            <span className="flex-1 text-[15px] font-medium text-base-content">Lock Chat</span>
            <span className={`text-[13px] font-semibold ${isLocked ? "text-primary" : "text-base-content/40"}`}>
              {isLocked ? "Locked" : "Off"}
            </span>
          </button>
        </div>
      </div>

      {/* Set-lock inline sheet */}
      {lockModal === "set" && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setLockModal(null)}>
          <div className="w-full sm:max-w-xs bg-base-100 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Lock this chat</h2>
            <p className="text-xs text-base-content/50 mb-4">Set a PIN (min 4 digits) to protect this conversation.</p>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="PIN code"
              className="input input-bordered w-full rounded-2xl mb-3"
              autoFocus
            />
            <button
              onClick={doLock}
              disabled={newPin.length < 4}
              className="btn btn-primary w-full rounded-2xl disabled:opacity-40"
            >
              Lock chat
            </button>
          </div>
        </div>
      )}

      <ChatLockModal chat={user} open={lockModal === "unlock"} onSubmit={doUnlock} onClose={() => setLockModal(null)} />
    </div>
  );
};

export default UserProfilePanel;
