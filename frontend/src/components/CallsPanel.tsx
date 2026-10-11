import { useEffect, useState } from "react";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import Avatar from "./Avatar";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";
import { formatChatTime } from "../lib/utils";

const CallsPanel = () => {
  const { fetchRecents, startCall, active, incoming } = useCallStore();
  const { setSelectedUser, users } = useChatStore();
  const [recents, setRecents] = useState<any[]>([]);

  useEffect(() => {
    fetchRecents().then(setRecents);
  }, [active, incoming]); // eslint-disable-line react-hooks/exhaustive-deps

  const callBack = (entry: any, type: "voice" | "video") => {
    const other = entry.other;
    if (!other?._id) return;
    const full = users.find((u) => String(u._id) === String(other._id));
    startCall(
      { _id: other._id, fullName: other.fullName ?? full?.fullName ?? "Unknown", profilePic: other.profilePic ?? full?.profilePic },
      type
    );
  };

  const openChat = (entry: any) => {
    const full = users.find((u) => String(u._id) === String(entry.other?._id));
    if (full) setSelectedUser(full);
  };

  return (
    <aside className="h-full w-full bg-base-100 flex flex-col relative overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-[22px] font-bold tracking-tight text-base-content">Calls</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pb-24">
        {recents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="size-14 rounded-3xl bg-base-200 flex items-center justify-center mb-3">
              <Phone className="size-7 text-base-content/40" />
            </div>
            <h3 className="font-semibold text-base-content mb-1">No recent calls</h3>
            <p className="text-base-content/50 text-sm">Tap the phone icon in any chat to start calling.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recents.map((r) => (
              <div
                key={r.id}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-base-200/60"
              >
                <div role="button" tabIndex={0} onClick={() => openChat(r)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <Avatar user={r.other} className="size-11" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-[15px] leading-tight">{r.other?.fullName ?? "Unknown"}</h3>
                    <p className={`text-[13px] truncate mt-0.5 flex items-center gap-1 ${r.status === "missed" ? "text-red-500" : "text-base-content/50"}`}>
                      {r.direction === "in" ? (
                        r.status === "missed" ? <PhoneMissed size={13} /> : <PhoneIncoming size={13} />
                      ) : (
                        <PhoneOutgoing size={13} />
                      )}
                      {r.status === "missed" ? "Missed" : r.status === "declined" ? "Declined" : r.durationSec > 0 ? `${Math.floor(r.durationSec / 60)}:${String(r.durationSec % 60).padStart(2, "0")}` : "Answered"}
                      {" · "}
                      {formatChatTime(r.startedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => callBack(r, "voice")}
                  className="p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-content transition-all"
                  aria-label="Voice call"
                >
                  <Phone size={17} />
                </button>
                <button
                  onClick={() => callBack(r, "video")}
                  className="p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-content transition-all"
                  aria-label="Video call"
                >
                  <Video size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default CallsPanel;
