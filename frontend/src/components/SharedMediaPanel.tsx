import { useEffect, useState } from "react";
import { X, Image as ImageIcon, Film, FileText, Link as LinkIcon, ExternalLink, Play, Loader } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";

interface MediaItem {
  id: string;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  createdAt: string;
  senderId: string;
}

interface MediaResponse {
  images: MediaItem[];
  videos: MediaItem[];
  files: MediaItem[];
  links: MediaItem[];
}

type Tab = "videos" | "images" | "files";

const TABS: { id: Tab; label: string }[] = [
  { id: "videos", label: "Videos" },
  { id: "images", label: "Images" },
  { id: "files", label: "Files" },
];

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/**
 * v3 media panel — the right pane of the reference layout (Videos / Images /
 * Files). Served by GET /api/messages/media/:userId with a local-messages
 * fallback when offline.
 */
const SharedMediaPanel = ({ userId, onClose }: { userId: string; onClose: () => void }) => {
  const [tab, setTab] = useState<Tab>("images");
  const [data, setData] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages, setLightboxImage } = useChatStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    const linkRegex = /(https?:\/\/[^\s<]+[^.,:;"'!)\]\s])/;

    const fromLocal = (): MediaResponse => {
      const live = messages.filter((m) => !m.isDeleted);
      const images: MediaItem[] = [];
      const videos: MediaItem[] = [];
      const files: MediaItem[] = [];
      const links: MediaItem[] = [];
      for (const m of live) {
        const f = m.file as { url?: string; name?: string; type?: string; size?: number } | undefined;
        const fType = f?.type ?? "";
        const item = {
          id: m._id,
          url: f?.url ?? m.image ?? "",
          name: f?.name,
          type: fType,
          size: f?.size,
          createdAt: m.createdAt,
          senderId: m.senderId,
        };
        if (fType.startsWith("video/")) videos.push(item);
        else if (fType.startsWith("image/") || m.image) images.push(item);
        else if (f?.url) files.push(item);
        if (m.text) {
          const match = m.text.match(linkRegex);
          if (match) links.push({ id: m._id, url: match[0], createdAt: m.createdAt, senderId: m.senderId });
        }
      }
      return { images, videos, files, links };
    };

    axiosInstance
      .get(`/messages/media/${userId}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setData(fromLocal());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, messages]);

  const items = data ? data[tab] : [];
  const counts = {
    videos: data?.videos.length ?? 0,
    images: data?.images.length ?? 0,
    files: (data?.files.length ?? 0) + (data?.links.length ?? 0),
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 lg:static lg:z-auto lg:flex-shrink-0 bg-base-100 border-l border-base-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-[15px] text-base-content">Shared Media</h3>
        <button
          onClick={onClose}
          className="p-2 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-all"
          title="Close media panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
              tab === t.id
                ? "bg-primary text-primary-content"
                : "text-base-content/50 hover:bg-base-200 hover:text-base-content"
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && <span className="ml-1 opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="size-6 animate-spin text-primary" />
          </div>
        ) : tab === "images" || tab === "videos" ? (
          items.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => tab === "images" && setLightboxImage(item.url)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-base-200 group hover:opacity-90 active:scale-95 transition-all"
                >
                  {tab === "videos" ? (
                    <span className="size-full flex items-center justify-center bg-base-200 text-base-content/60">
                      <Play size={18} className="fill-current" />
                      <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/60 text-white px-1 rounded">
                        VIDEO
                      </span>
                    </span>
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
              {tab === "images" ? (
                <ImageIcon size={28} className="stroke-1.5 mb-2 opacity-50" />
              ) : (
                <Film size={28} className="stroke-1.5 mb-2 opacity-50" />
              )}
              <span className="text-xs font-semibold">No shared {tab} yet</span>
            </div>
          )
        ) : (data?.files.length ?? 0) + (data?.links.length ?? 0) > 0 ? (
          <div className="space-y-4">
            {data!.files.length > 0 && (
              <div className="space-y-1.5">
                {data!.files.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-base-200/50 hover:bg-base-200 rounded-xl transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-base-content truncate">{item.name ?? "File"}</p>
                      <p className="text-[10px] text-base-content/50 font-medium">
                        {formatSize(item.size)}
                        {formatSize(item.size) && " • "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ExternalLink size={12} className="text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            {data!.links.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-2 px-1">
                  Links
                </h4>
                <div className="space-y-1.5">
                  {data!.links.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 bg-base-200/50 hover:bg-base-200 rounded-xl transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                        <LinkIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-primary truncate hover:underline">{item.url}</p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ExternalLink size={12} className="text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
            <FileText size={28} className="stroke-1.5 mb-2 opacity-50" />
            <span className="text-xs font-semibold">No shared files yet</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SharedMediaPanel;
