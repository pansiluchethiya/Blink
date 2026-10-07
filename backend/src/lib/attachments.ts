import cloudinary from "./cloudinary.js";

/** Allowed sticker/gif metadata keys — everything else is dropped. */
const META_KINDS = new Set(["sticker", "gif"]);

/** Remote http(s) URLs pass through; base64/data URIs get uploaded to Cloudinary. */
export async function resolveImageUrl(image: unknown): Promise<string | null> {
  if (typeof image !== "string" || image.length === 0) return null;
  if (/^https?:\/\//i.test(image)) return image;
  const uploadResponse = await cloudinary.uploader.upload(image);
  return uploadResponse.secure_url as string;
}

/** Parse optional file-metadata JSON (kind/pack/alt/preview) from a body field. */
export function parseFileMeta(raw: unknown): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== "object" || !META_KINDS.has((obj as any).kind)) return undefined;
    const { kind, pack, alt, preview } = obj as any;
    return {
      kind,
      ...(typeof pack === "string" ? { pack } : {}),
      ...(typeof alt === "string" ? { alt } : {}),
      ...(typeof preview === "string" ? { preview } : {}),
    };
  } catch {
    return undefined;
  }
}
