import { Request, Response } from "express";
import { prisma, toResponse } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string => String((req as any).user?._id ?? (req as any).user?.id);

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ARCHIVED = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only image and video stories are allowed"));
  },
});
export const storyUpload = upload.single("media");

const ownerSelect = {
  id: true,
  fullName: true,
  username: true,
  handle: true,
  profilePic: true,
} as const;

const shapeStory = (s: any) => ({ ...toResponse(s), owner: s.owner ? toResponse(s.owner) : null });

// Purge job: expired, non-archived stories are destroyed on Cloudinary AND
// deleted from the DB. Archived stories are exempt (the 24h clock ignores them).
export const deleteExpiredStories = async (): Promise<void> => {
  try {
    const now = new Date();
    const expired = await prisma.story.findMany({
      where: { expiresAt: { lte: now }, archived: false },
      select: { id: true, publicId: true, mediaType: true },
      take: 200,
    });
    for (const s of expired) {
      try {
        if (s.publicId) {
          await cloudinary.uploader.destroy(s.publicId, {
            resource_type: s.mediaType === "video" ? "video" : "image",
          });
        }
      } catch (e: any) {
        console.error("Story cloudinary destroy failed:", s.id, e?.message);
      }
    }
    if (expired.length) {
      await prisma.story.deleteMany({ where: { id: { in: expired.map((s) => s.id) } } });
      console.log(`Purged ${expired.length} expired stories`);
    }
  } catch (error: any) {
    console.error("Failed to clean up expired stories:", error.message);
  }
};

export const createStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = meId(req);
    // Minors: stories are view-only.
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { isMinor: true } });
    if (owner?.isMinor) {
      res.status(403).json({ error: "Story uploads aren't available for this account" });
      return;
    }
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: "A media file (image/video) is required" });
      return;
    }
    const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
    const caption = String((req.body?.caption ?? "").toString()).slice(0, 280);
    const publicId = `story_${ownerId}_${Date.now()}`;

    const uploaded = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      { resource_type: mediaType, public_id: publicId, folder: "blink-stories" }
    );

    const story = await prisma.story.create({
      data: {
        ownerId,
        mediaUrl: uploaded.secure_url,
        publicId: uploaded.public_id ?? publicId,
        mediaType,
        caption,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      },
      include: { owner: { select: ownerSelect } },
    });
    res.status(201).json(shapeStory(story));
  } catch (error: any) {
    console.error("Error in createStory:", error.message);
    res.status(500).json({ error: "Internal server error creating story" });
  }
};

// Feed: unexpired stories from me + accepted friends, newest first.
export const getStoryFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: myId }, { receiverId: myId }],
      },
      select: { requesterId: true, receiverId: true },
    });
    const peerIds = new Set<string>([myId]);
    for (const f of friendships) {
      peerIds.add(f.requesterId === myId ? f.receiverId : f.requesterId);
    }
    const stories = await prisma.story.findMany({
      where: { ownerId: { in: Array.from(peerIds) }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { owner: { select: ownerSelect } },
    });
    res.status(200).json(stories.map(shapeStory));
  } catch (error: any) {
    console.error("Error in getStoryFeed:", error.message);
    res.status(500).json({ error: "Internal server error fetching stories" });
  }
};

export const getMyStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const stories = await prisma.story.findMany({
      where: { ownerId: myId, OR: [{ expiresAt: { gt: new Date() } }, { archived: true }] },
      orderBy: { createdAt: "desc" },
      include: { owner: { select: ownerSelect } },
    });
    res.status(200).json(stories.map(shapeStory));
  } catch (error: any) {
    console.error("Error in getMyStories:", error.message);
    res.status(500).json({ error: "Internal server error fetching stories" });
  }
};

export const getArchivedStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stories = await prisma.story.findMany({
      where: { ownerId: meId(req), archived: true },
      orderBy: { archivedAt: "desc" },
      include: { owner: { select: ownerSelect } },
    });
    res.status(200).json(stories.map(shapeStory));
  } catch (error: any) {
    console.error("Error in getArchivedStories:", error.message);
    res.status(500).json({ error: "Internal server error fetching archived stories" });
  }
};

export const viewStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || (story.expiresAt <= new Date() && !story.archived)) {
      res.status(404).json({ error: "Story not found or expired" });
      return;
    }
    if (!story.viewedBy.includes(myId)) {
      await prisma.story.update({
        where: { id },
        data: { viewedBy: { push: myId } },
      });
    }
    res.status(200).json({ viewed: true });
  } catch (error: any) {
    console.error("Error in viewStory:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const archiveStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || story.ownerId !== myId) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    if (!story.archived) {
      const count = await prisma.story.count({ where: { ownerId: myId, archived: true } });
      if (count >= MAX_ARCHIVED) {
        res.status(400).json({ error: `You can only archive ${MAX_ARCHIVED} stories` });
        return;
      }
    }
    const updated = await prisma.story.update({
      where: { id },
      data: { archived: true, archivedAt: new Date() },
      include: { owner: { select: ownerSelect } },
    });
    res.status(200).json(shapeStory(updated));
  } catch (error: any) {
    console.error("Error in archiveStory:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unarchiveStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || story.ownerId !== myId) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    // Unarchiving restarts the 24h clock.
    const updated = await prisma.story.update({
      where: { id },
      data: { archived: false, archivedAt: null, expiresAt: new Date(Date.now() + STORY_TTL_MS) },
      include: { owner: { select: ownerSelect } },
    });
    res.status(200).json(shapeStory(updated));
  } catch (error: any) {
    console.error("Error in unarchiveStory:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || story.ownerId !== myId) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    try {
      if (story.publicId) {
        await cloudinary.uploader.destroy(story.publicId, {
          resource_type: story.mediaType === "video" ? "video" : "image",
        });
      }
    } catch (e: any) {
      console.error("Story cloudinary destroy failed:", id, e?.message);
    }
    await prisma.story.delete({ where: { id } });
    res.status(200).json({ deleted: true });
  } catch (error: any) {
    console.error("Error in deleteStory:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
