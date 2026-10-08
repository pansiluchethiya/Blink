import { Response } from "express";
import { prisma, toResponse } from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

/**
 * Compact recent-chat feed for the PWA widget (widgets data URL).
 * Public-with-fallback: 401 when logged out so the widget can render
 * its install/login placeholder.
 */
export const getWidgetRecent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loggedInUserId = meId(req);

    const recent = await prisma.message.findMany({
      where: {
        OR: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        isExpired: false,
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, profilePic: true } },
      },
    });

    const seen = new Map<string, any>();
    for (const msg of recent as any[]) {
      if (!msg.sender || !msg.receiver) continue;
      const other = msg.sender.id === loggedInUserId ? msg.receiver : msg.sender;
      if (other && !seen.has(other.id)) {
        seen.set(other.id, {
          user: toResponse(other),
          lastMessage: {
            text: msg.text ?? null,
            hasImage: Boolean(msg.image),
            hasFile: Boolean(msg.file),
            createdAt: msg.createdAt,
            fromMe: msg.senderId === loggedInUserId,
          },
        });
      }
      if (seen.size >= 8) break;
    }

    const unreadBySender = await prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: loggedInUserId, isRead: false, isExpired: false },
      _count: { _all: true },
    });
    const unreadMap = new Map(
      unreadBySender.map((g: any) => [String(g.senderId), g._count._all as number])
    );
    const totalUnread = [...unreadMap.values()].reduce((a, b) => a + b, 0);

    const chats = [...seen.entries()].map(([id, c]) => ({
      ...c,
      unreadCount: unreadMap.get(id) ?? 0,
    }));

    res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalUnread,
      chats,
    });
  } catch (error: any) {
    console.error("Error in getWidgetRecent: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
