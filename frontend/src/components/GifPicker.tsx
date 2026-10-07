import { useEffect, useState } from "react";
import { Loader, Search, X } from "lucide-react";
import {
  hasGiphyKey,
  searchGifs,
  searchStickers,
  trendingGifs,
  trendingStickers,
  type GiphyMedia,
} from "../lib/giphy";
import { STICKER_PACKS } from "../lib/stickerPacks";

export interface StickerPick {
  image: string;
  file: { kind: "sticker"; pack: string; alt: string };
}

export interface GifPick {
  image: string;
  file: { kind: "gif"; preview: string };
}

export type GifPickerPick = StickerPick | GifPick;

interface GifPickerProps {
  onPick: (pick: GifPickerPick) => void;
  onClose?: () => void;
}

type Tab = "stickers" | "gifs";

const NOTICE = "Add VITE_GIPHY_KEY (free: developers.giphy.com/dashboard)";

export default function GifPicker({ onPick, onClose }: GifPickerProps) {
  const [tab, setTab] = useState<Tab>("stickers");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<GiphyMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyAvailable] = useState(() => hasGiphyKey());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setQuery("");
    setDebounced("");
    setResults([]);
    setError(null);
  }, [tab]);

  useEffect(() => {
    if (tab === "gifs" && !keyAvailable) return;
    if (tab === "stickers" && !keyAvailable) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        const data =
          tab === "gifs"
            ? debounced
              ? await searchGifs(debounced)
              : await trendingGifs()
            : debounced
              ? await searchStickers(debounced)
              : await trendingStickers();
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setError("Couldn't load from Giphy. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, debounced, keyAvailable]);

  return (
    <div className="absolute bottom-full mb-3 left-0 z-[60] card bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-[320px] sm:w-[360px] overflow-hidden animate-fadeIn">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="tabs tabs-boxed bg-base-200 p-1">
          <button
            type="button"
            className={tab === "stickers" ? "tab tab-active" : "tab"}
            onClick={() => setTab("stickers")}
          >
            Stickers
          </button>
          <button
            type="button"
            className={tab === "gifs" ? "tab tab-active" : "tab"}
            onClick={() => setTab("gifs")}
          >
            GIFs
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-base-content/60"
            aria-label="Close GIF picker"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="px-3 pb-2">
        <label className="input input-sm input-bordered bg-base-200 border-base-300 w-full flex items-center gap-2">
          <Search size={14} className="text-base-content/50 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "stickers" ? "Search stickers..." : "Search GIFs..."}
            className="grow bg-transparent outline-none text-sm placeholder:text-base-content/40"
          />
        </label>
      </div>

      <div className="max-h-[320px] overflow-y-auto px-3 pb-3">
        {tab === "stickers" && (
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-base-content/60 px-1 mb-2">
              Built-in
            </p>
            {STICKER_PACKS.map((pack) => (
              <div key={pack.id} className="grid grid-cols-3 gap-2">
                {pack.stickers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.alt}
                    onClick={() => onPick({ image: s.src, file: { kind: "sticker", pack: pack.id, alt: s.alt } })}
                    className="aspect-square flex items-center justify-center bg-base-200 border border-base-300 rounded-xl hover:bg-base-300 transition-colors active:scale-95"
                  >
                    <img src={s.src} alt={s.alt} loading="lazy" className="w-12 h-12 object-contain" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "gifs" && !keyAvailable ? (
          <div className="bg-base-200 border border-base-300 rounded-xl p-4 text-sm text-base-content/70">
            {NOTICE}
          </div>
        ) : tab === "stickers" && !keyAvailable ? (
          <div className="bg-base-200 border border-base-300 rounded-xl p-3 text-xs text-base-content/60">
            {NOTICE} for Giphy stickers — built-in stickers still work.
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-base-content/60 px-1 mb-2">
              {tab === "gifs" ? "Giphy" : "Giphy stickers"}
            </p>
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-base-content/50">
                <Loader size={20} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-base-200 border border-base-300 rounded-xl p-4 text-sm text-base-content/70">
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="bg-base-200 border border-base-300 rounded-xl p-4 text-sm text-base-content/60 text-center">
                No results.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {results.map((m) =>
                  tab === "gifs" ? (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onPick({ image: m.url, file: { kind: "gif", preview: m.preview } })}
                      className="aspect-square overflow-hidden bg-base-200 border border-base-300 rounded-xl hover:opacity-90 transition-opacity active:scale-95"
                    >
                      <img src={m.preview} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onPick({ image: m.url, file: { kind: "sticker", pack: "giphy", alt: m.id } })}
                      className="aspect-square flex items-center justify-center bg-base-200 border border-base-300 rounded-xl hover:bg-base-300 transition-colors active:scale-95 overflow-hidden"
                    >
                      <img src={m.preview} alt="" loading="lazy" className="w-full h-full object-contain" />
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
