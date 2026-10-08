import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Share2, Home } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { db } from "../lib/db";
import { IUser } from "../types/index.js";
import Avatar from "../components/Avatar";

interface SharePayload {
  text: string;
  files: File[];
}

/**
 * Target for OS shares (share_target POST via service worker) and
 * file_handlers (via launchQueue -> incomingShare). Shows a chat picker,
 * then drops the shared content into that chat's composer.
 */
export default function SharePage() {
  const navigate = useNavigate();
  const {
    users,
    getUsers,
    isUsersLoading,
    setSelectedUser,
    setDraft,
    setPendingAttachment,
    incomingShare,
    setIncomingShare,
  } = useChatStore();
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (incomingShare) {
      setPayload(incomingShare);
      return;
    }
    let cancelled = false;
    db.shareStash
      .get("share")
      .then((s) => {
        if (cancelled || !s) return;
        const text = [s.title, s.text, s.url].filter(Boolean).join("\n");
        if (text || (s.files && s.files.length > 0)) {
          setPayload({ text, files: s.files ?? [] });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [incomingShare]);

  const choose = (user: IUser) => {
    if (!payload) return;
    const extra =
      payload.files.length > 1
        ? `(+${payload.files.length - 1} more: ${payload.files
            .slice(1)
            .map((f) => f.name)
            .join(", ")})`
        : "";
    const text = [payload.text, extra].filter(Boolean).join("\n");
    setSelectedUser(user);
    if (text) setDraft(user._id, text);
    if (payload.files.length > 0) setPendingAttachment(payload.files[0]);
    setIncomingShare(null);
    db.shareStash.delete("share").catch(() => {});
    navigate("/");
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Share to Blink</h1>
      </div>

      {payload && (
        <div className="card bg-base-200 border border-base-300 p-3 my-3 text-sm">
          {payload.text && (
            <p className="line-clamp-3 whitespace-pre-wrap">{payload.text}</p>
          )}
          {payload.files.length > 0 && (
            <p className="text-base-content/60 text-xs mt-1">
              {payload.files.length} file{payload.files.length > 1 ? "s" : ""}:{" "}
              {payload.files
                .slice(0, 3)
                .map((f) => f.name)
                .join(", ")}
              {payload.files.length > 3 ? "…" : ""}
            </p>
          )}
        </div>
      )}

      {!payload ? (
        <div className="text-center py-10">
          <p className="text-base-content/60 mb-4">Nothing to share.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/")}>
            <Home className="w-4 h-4" /> Back to chats
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-base-content/60 mb-3">
            Choose a conversation:
          </p>
          {isUsersLoading && users.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => (
                <li key={u._id}>
                  <button
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-base-200 text-left"
                    onClick={() => choose(u)}
                  >
                    <Avatar user={u} className="size-10" />
                    <span className="font-semibold text-sm truncate">
                      {u.fullName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
