import { Response } from "express";
import { prisma, isValidId } from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string => String((req as any).user?._id ?? (req as any).user?.id);

const toFolder = (f: { id: string; name: string; color: string; memberIds: string[] }) => ({
  id: f.id,
  name: f.name,
  color: f.color,
  memberIds: f.memberIds,
});

export const getFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folders = await prisma.folder.findMany({
      where: { ownerId: meId(req) },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(folders.map(toFolder));
  } catch (error: any) {
    console.log("Error in getFolders: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color, memberIds } = req.body as { name?: string; color?: string; memberIds?: unknown };
    const cleanName = String(name ?? "").trim().slice(0, 24);
    if (!cleanName) {
      res.status(400).json({ error: "Folder name is required" });
      return;
    }
    const members = Array.isArray(memberIds)
      ? (memberIds as unknown[]).filter((m): m is string => isValidId(m)).map(String)
      : [];
    const folder = await prisma.folder.create({
      data: { ownerId: meId(req), name: cleanName, color: String(color ?? "#F59E0B"), memberIds: members },
    });
    res.status(201).json(toFolder(folder));
  } catch (error: any) {
    console.log("Error in createFolder: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidId(id as string)) {
      res.status(400).json({ error: "Invalid folder id" });
      return;
    }
    const existing = await prisma.folder.findFirst({ where: { id: String(id), ownerId: meId(req) } });
    if (!existing) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    const { name, color } = req.body as { name?: string; color?: string };
    const folder = await prisma.folder.update({
      where: { id: String(id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim().slice(0, 24) || existing.name } : {}),
        ...(color !== undefined ? { color: String(color) } : {}),
      },
    });
    res.status(200).json(toFolder(folder));
  } catch (error: any) {
    console.log("Error in updateFolder: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidId(id as string)) {
      res.status(400).json({ error: "Invalid folder id" });
      return;
    }
    const existing = await prisma.folder.findFirst({ where: { id: String(id), ownerId: meId(req) } });
    if (!existing) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    await prisma.folder.delete({ where: { id: String(id) } });
    res.status(200).json({ id: String(id) });
  } catch (error: any) {
    console.log("Error in deleteFolder: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Toggle one chat's membership in a folder. Single membership: the chat is
// removed from the owner's other folders first.
export const toggleFolderMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { chatId } = req.body as { chatId?: string };
    if (!isValidId(id as string) || !isValidId(chatId as string)) {
      res.status(400).json({ error: "Invalid folder or chat id" });
      return;
    }
    const ownerId = meId(req);
    const folder = await prisma.folder.findFirst({ where: { id: String(id), ownerId } });
    if (!folder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    const chat = String(chatId);
    // Prisma has no atomic pull; rewrite the other folders without this chat.
    const others = await prisma.folder.findMany({
      where: { ownerId, id: { not: String(id) }, memberIds: { has: chat } },
    });
    for (const o of others) {
      await prisma.folder.update({
        where: { id: o.id },
        data: { memberIds: o.memberIds.filter((m) => m !== chat) },
      });
    }
    const has = folder.memberIds.includes(chat);
    const updated = await prisma.folder.update({
      where: { id: String(id) },
      data: { memberIds: has ? folder.memberIds.filter((m) => m !== chat) : [...folder.memberIds, chat] },
    });
    res.status(200).json(toFolder(updated));
  } catch (error: any) {
    console.log("Error in toggleFolderMember: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
