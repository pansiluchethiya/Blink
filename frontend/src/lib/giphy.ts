import { GiphyFetch } from "@giphy/js-fetch-api";
import type { IGif } from "@giphy/js-types";

export interface GiphyMedia {
  id: string;
  /** Original (full-size) URL — used when sending. */
  url: string;
  /** Fixed-width preview URL — used for grid thumbnails. */
  preview: string;
  w?: number;
  h?: number;
}

function getApiKey(): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const key = env?.VITE_GIPHY_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

export function hasGiphyKey(): boolean {
  return Boolean(getApiKey());
}

let gf: GiphyFetch | null = null;

function getGf(): GiphyFetch {
  if (gf) return gf;
  const key = getApiKey();
  if (!key) throw new Error("Missing VITE_GIPHY_KEY");
  gf = new GiphyFetch(key);
  return gf;
}

function toMedia(g: IGif): GiphyMedia | null {
  const original = g.images?.original as { url?: string; width?: string; height?: string } | undefined;
  const fixed = g.images?.fixed_width as { url?: string } | undefined;
  const url = original?.url ?? fixed?.url ?? "";
  const preview = fixed?.url ?? original?.url ?? "";
  if (!url) return null;
  const w = original?.width ? parseInt(original.width, 10) : undefined;
  const h = original?.height ? parseInt(original.height, 10) : undefined;
  return {
    id: g.id,
    url,
    preview,
    w: Number.isFinite(w) ? w : undefined,
    h: Number.isFinite(h) ? h : undefined,
  };
}

const LIMIT = 24;

export async function trendingGifs(): Promise<GiphyMedia[]> {
  const { data } = await getGf().trending({ limit: LIMIT, type: "gifs", rating: "pg" });
  return data.map(toMedia).filter((m): m is GiphyMedia => m !== null);
}

export async function searchGifs(q: string): Promise<GiphyMedia[]> {
  const query = q.trim();
  if (!query) return trendingGifs();
  const { data } = await getGf().search(query, { limit: LIMIT, type: "gifs", rating: "pg", sort: "relevant" });
  return data.map(toMedia).filter((m): m is GiphyMedia => m !== null);
}

export async function trendingStickers(): Promise<GiphyMedia[]> {
  const { data } = await getGf().trending({ limit: LIMIT, type: "stickers", rating: "pg" });
  return data.map(toMedia).filter((m): m is GiphyMedia => m !== null);
}

export async function searchStickers(q: string): Promise<GiphyMedia[]> {
  const query = q.trim();
  if (!query) return trendingStickers();
  const { data } = await getGf().search(query, { limit: LIMIT, type: "stickers", rating: "pg", sort: "relevant" });
  return data.map(toMedia).filter((m): m is GiphyMedia => m !== null);
}
