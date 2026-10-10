import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma, toResponse, toList, isValidId } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { resolveImageUrl, parseFileMeta } from "../lib/attachments.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import NotificationService from "../services/notification.service.js";
import multer from "multer";
import crypto from "crypto";
import { getLinkMetadata } from "../lib/linkPreview.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string => String((req as any).user?._id ?? (req as any).user?.id);

const storage = multer.memoryStorage();

export const getLinkPreview = async (req: Request, res: Response): Promise<any> => {
  try {
    let { url } = req.query as { url?: string };
    if (!url) return res.status(400).json({ error: "URL query parameter is required" });

    // Handle cases where the URL might be "undefined" as a string or empty
    if (url === "undefined" || url === "null" || url.trim() === "") {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    // Ensure URL has protocol
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const metadata = await getLinkMetadata(url);
    if (!metadata) {
      return res.status(404).json({ error: "Could not fetch metadata for the provided URL" });
    }

    res.status(200).json(metadata);
  } catch (error: any) {
    console.error("Error in getLinkPreview controller:", error.message);
    res.status(500).json({ error: "Internal server error during link preview generation" });
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Allow all file types, but check size
    cb(null, true);
  },
});

const hashPin = (pin: string): string =>
  crypto.createHash("sha256").update(pin).digest("hex");

export const deleteExpiredMessages = async (): Promise<void> => {
  try {
    const now = new Date();
    const res = await prisma.message.updateMany({
      where: { expiresAt: { lte: now }, isExpired: false },
      data: { isExpired: true, text: "[Message expired]", image: null, file: undefined },
    });
    if (res.count > 0) console.log(`Expired ${res.count} messages from automated cleanup`);
    await prisma.workspaceMessage.updateMany({
      where: { expiresAt: { lte: now } },
      data: { text: "[Message expired]", image: "" },
    });
  } catch (error: any) {
    console.error("Failed to clean up expired messages:", error.message);
  }
};

export const getUsersForSidebar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loggedInUserId = meId(req);

    // Last 200 relevant messages only (perf: no full scan), then aggregate latest per peer
    const recent = await prisma.message.findMany({
      where: { OR: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }], isExpired: false },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true, email: true } },
        receiver: { select: { id: true, fullName: true, profilePic: true, email: true } },
      },
    });

    const userMap = new Map<string, any>();

    // Unread DM counts per sender — one indexed aggregate, no per-user queries.
    const unread = await prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: loggedInUserId, isRead: false, isExpired: false, isDeleted: false },
      _count: { id: true },
    });
    const unreadMap = new Map(unread.map((u) => [u.senderId, u._count.id]));

    for (const msg of recent as any[]) {
      if (!msg.sender || !msg.receiver) continue;
      const other = msg.sender.id === loggedInUserId ? msg.receiver : msg.sender;
      if (other && !userMap.has(other.id)) {
        userMap.set(other.id, { ...toResponse(other), lastMessage: toResponse(msg), unreadCount: unreadMap.get(other.id) ?? 0 });
      }
    }

    // Only users with recent chats first; others paginated (50) to keep sidebar fast
    const others = await prisma.user.findMany({
      where: { id: { not: loggedInUserId } },
      select: { id: true, fullName: true, email: true, profilePic: true, status: true, lastSeen: true, username: true, handle: true },
      take: 50,
      orderBy: { fullName: "asc" },
    });
    for (const u of others) {
      if (!userMap.has(u.id)) userMap.set(u.id, { ...toResponse(u as any), lastMessage: null, unreadCount: 0 });
    }

    const users = Array.from(userMap.values()).sort((a: any, b: any) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { query } = req.query as { query?: string };
    const loggedInUserId = meId(req);

    if (!query || query.trim() === "") return res.status(200).json([]);

    const q = query.trim();
    const searchResults = await prisma.user.findMany({
      where: {
        id: { not: loggedInUserId },
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
    });

    res.status(200).json(toList(searchResults.map(({ password: _p, ...r }) => r as any)));
  } catch (error: any) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id: userToChatId } = req.params;
    const { limit = "30", before } = req.query as { limit?: string; before?: string };
    const myId = meId(req);

    if (!isValidId(userToChatId as string) || !isValidId(myId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const take = Math.min(Math.max(parseInt(limit as string) || 30, 1), 100);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
        isExpired: false,
        ...(before ? { createdAt: { lt: new Date(before as string) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: { replyTo: true },
    });

    res.status(200).json(toList(messages as any[]).reverse());
  } catch (error: any) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    await prisma.message.updateMany({
      where: { senderId: String(userId), receiverId: myId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    const senderSocketId = getReceiverSocketId(String(userId));
    if (senderSocketId) io.to(senderSocketId).emit("messagesReadReceipt", myId);

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error: any) {
    console.log("Error in markMessagesAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = [
  upload.single("file"),
  async (req: any, res: Response): Promise<any> => {
    try {
      const { text, image, replyTo, viewOnce, expiresAt, file, fileMeta } = req.body;
      const { id: receiverId } = req.params;
      const senderId = String((req as any).user?._id ?? (req as any).user?.id);
      const sender = (req as any).user;

      if (!isValidId(receiverId as string) || !isValidId(senderId)) {
        return res.status(400).json({ error: "Invalid user id" });
      }

      if (text && text.length > 1024) {
        return res.status(400).json({ error: "Message must be 1024 characters or less" });
      }

      // Check if users are friends (unless they are messaging themselves or one is the Help Center)
      if (senderId !== String(receiverId)) {
        const helpCenterEmail = process.env.HELP_CENTER_EMAIL || "pansiluco@gmail.com";
        const isHelpCenterSender = sender?.email === helpCenterEmail;
        let isHelpCenterReceiver = false;

        const receiverUser = await prisma.user.findUnique({ where: { id: String(receiverId) } });
        if (!receiverUser) {
          return res.status(404).json({ error: "Receiver not found" });
        }
        if (receiverUser.email === helpCenterEmail) {
          isHelpCenterReceiver = true;
        }

        if (!isHelpCenterSender && !isHelpCenterReceiver) {
          const friendship = await prisma.friendship.findFirst({
            where: {
              status: "accepted",
              OR: [
                { requesterId: senderId, receiverId: String(receiverId) },
                { requesterId: String(receiverId), receiverId: senderId },
              ],
            },
          });

          if (!friendship) {
            return res.status(403).json({ error: "You can only message users you are friends with" });
          }
        }
      }

      let imageUrl: string | null = null;
      if (image) {
        // Remote GIF/sticker URLs pass through; base64 uploads go to Cloudinary
        imageUrl = await resolveImageUrl(image);
      }

      let fileData: any = undefined;
      if (req.file) {
        // Upload file to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
          resource_type: "auto",
          public_id: `file_${Date.now()}_${req.file.originalname}`,
        });
        fileData = {
          url: uploadResponse.secure_url,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
        };
      }
      // Sticker/GIF metadata (kind/pack/alt/preview) — merged onto uploads or stored alone
      const meta = parseFileMeta(file ?? fileMeta);
      if (meta) fileData = { ...(fileData ?? {}), ...meta };

      const replyToId = typeof replyTo === "string" && isValidId(replyTo) ? replyTo : undefined;

      const created = await prisma.message.create({
        data: {
          senderId,
          receiverId: String(receiverId),
          deliveredAt: new Date(),
          text: typeof text === "string" ? text : null,
          image: imageUrl,
          file: fileData ?? undefined,
          isRead: false,
          replyToId,
          viewOnce: viewOnce === "true" || viewOnce === true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: { replyTo: true },
      });

      const out = toResponse(created as any) as any;

      const receiverSocketId = getReceiverSocketId(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", out);
      }
      // Emit delivery status to sender
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", { messageId: out._id, deliveredAt: out.deliveredAt });
      }
      NotificationService.createNotification({
        recipient: String(receiverId),
        actor: senderId,
        type: "direct_message",
        title: sender?.fullName ?? "New message",
        body: text || (image ? "Sent an image" : "Sent a file"),
        metadata: {
          messageId: out._id,
          conversationId: senderId,
        },
      });

      // Handle mentions (@username)
      if (text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = text.match(mentionRegex);
        if (mentions) {
          for (const mention of mentions) {
            const username = mention.substring(1);
            const mentionedUser = await prisma.user.findFirst({
              where: { fullName: { equals: username, mode: "insensitive" } },
            });
            if (mentionedUser && mentionedUser.id !== senderId && mentionedUser.id !== String(receiverId)) {
              NotificationService.createNotification({
                recipient: mentionedUser.id,
                actor: senderId,
                type: "mention",
                title: "Mentioned you",
                body: text,
                metadata: {
                  messageId: out._id,
                  conversationId: senderId,
                },
              });
            }
          }
        }
      }

      // Handle reply
      if (replyToId) {
        const originalMessage = await prisma.message.findUnique({ where: { id: replyToId } });
        if (originalMessage && originalMessage.senderId !== senderId && originalMessage.senderId !== String(receiverId)) {
          NotificationService.createNotification({
            recipient: originalMessage.senderId,
            actor: senderId,
            type: "reply",
            title: "Replied to your message",
            body: text,
            metadata: {
              messageId: out._id,
              conversationId: senderId,
            },
          });
        }
      }

      res.status(201).json(out);
    } catch (error: any) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// Add reaction to message
export const addReaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = meId(req);

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }
    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const reactions = (((message.reactions as any) ?? {}) as Record<string, string[]>);
    const usersWithReaction = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
    if (!usersWithReaction.some((id: any) => String(id) === userId)) {
      usersWithReaction.push(userId);
    }
    reactions[emoji] = usersWithReaction;

    await prisma.message.update({
      where: { id: message.id },
      data: { reactions: reactions as any },
    });

    // Send notification to message sender
    if (message.senderId !== userId) {
      NotificationService.createNotification({
        recipient: message.senderId,
        actor: userId,
        type: "reaction",
        title: "Reacted to your message",
        body: emoji,
        metadata: {
          messageId: message.id,
          reactionType: emoji,
        },
      });
    }

    // Emit to other user
    const otherUserId = userId === message.senderId ? message.receiverId : message.senderId;

    if (otherUserId) {
      const otherUserSocketId = getReceiverSocketId(String(otherUserId));
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messageReactionAdded", {
          messageId,
          emoji,
          userId,
          reactions,
        });
      }
    }

    res.status(200).json({ reactions });
  } catch (error: any) {
    console.log("Error in addReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove reaction from message
export const removeReaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = meId(req);

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }
    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const reactions = (((message.reactions as any) ?? {}) as Record<string, string[]>);
    if (Array.isArray(reactions[emoji])) {
      const usersWithReaction = reactions[emoji];
      const index = usersWithReaction.findIndex((id: any) => String(id) === userId);
      if (index !== -1) {
        usersWithReaction.splice(index, 1);
        if (usersWithReaction.length === 0) {
          delete reactions[emoji];
        } else {
          reactions[emoji] = usersWithReaction;
        }
        await prisma.message.update({
          where: { id: message.id },
          data: { reactions: reactions as any },
        });
      }
    }

    // Emit to other user
    const otherUserId = userId === message.senderId ? message.receiverId : message.senderId;

    if (otherUserId) {
      const otherUserSocketId = getReceiverSocketId(String(otherUserId));
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messageReactionRemoved", {
          messageId,
          emoji,
          userId,
          reactions,
        });
      }
    }

    res.status(200).json({ reactions });
  } catch (error: any) {
    console.log("Error in removeReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit message
export const editMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = meId(req);

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    if (text && text.length > 1024) {
      return res.status(400).json({ error: "Message must be 1024 characters or less" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: "Can only edit your own messages" });
    }

    // Add to edit history
    const editHistory = (Array.isArray(message.editHistory) ? [...(message.editHistory as any[])] : []) as any[];
    editHistory.push({
      text: message.text || "",
      editedAt: new Date().toISOString(),
    });

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: {
        text,
        isEdited: true,
        editedAt: new Date(),
        editHistory: editHistory as any,
      },
    });

    // Emit to other user
    if (message.receiverId) {
      const otherUserSocketId = getReceiverSocketId(String(message.receiverId));
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messageEdited", {
          messageId,
          text,
          isEdited: true,
          editedAt: updated.editedAt,
        });
      }
    }

    res.status(200).json(toResponse(updated as any));
  } catch (error: any) {
    console.log("Error in editMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message (soft-delete to preserve thread/reply integrity)
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const userId = meId(req);

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }

    const sender = await prisma.user.findUnique({ where: { id: message.senderId } });
    const senderName = sender ? sender.fullName : "User";
    const deletionText = `This message was deleted by ${senderName}`;

    await prisma.message.update({
      where: { id: message.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        text: deletionText,
        image: null,
        file: null as any,
        replyToId: null,
        reactions: {} as any,
        isPinned: false,
      },
    });

    // Emit to other user
    if (message.receiverId) {
      const otherUserSocketId = getReceiverSocketId(String(message.receiverId));
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messageDeleted", { messageId, text: deletionText });
      }
    }

    res.status(200).json({ message: "Message deleted successfully", text: deletionText });
  } catch (error: any) {
    console.log("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin/Unpin message
export const togglePinMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const userId = meId(req);

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const nextPinned = !message.isPinned;
    const updated = await prisma.message.update({
      where: { id: message.id },
      data: {
        isPinned: nextPinned,
        pinnedAt: nextPinned ? new Date() : null,
        pinnedBy: nextPinned ? userId : null,
      },
    });

    // Emit to other user
    const otherUserId = userId === message.senderId ? message.receiverId : message.senderId;

    if (otherUserId) {
      const otherUserSocketId = getReceiverSocketId(String(otherUserId));
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messagePinToggled", {
          messageId,
          isPinned: nextPinned,
        });
      }
    }

    res.status(200).json(toResponse(updated as any));
  } catch (error: any) {
    console.log("Error in togglePinMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pinned messages
export const getPinnedMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    if (!isValidId(userId as string)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const pinnedMessages = await prisma.message.findMany({
      where: {
        isPinned: true,
        OR: [
          { senderId: myId, receiverId: String(userId) },
          { senderId: String(userId), receiverId: myId },
        ],
      },
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, profilePic: true } },
      },
      orderBy: { pinnedAt: "desc" },
    });

    res.status(200).json(toList(pinnedMessages as any[]));
  } catch (error: any) {
    console.log("Error in getPinnedMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search messages
export const searchMessages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { query, sender, startDate, endDate, fileType } = req.query as {
      query?: string;
      sender?: string;
      startDate?: string;
      endDate?: string;
      fileType?: string;
    };
    const myId = meId(req);

    if (!isValidId(userId as string)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const createdAt: any = {};
    if (startDate) createdAt.gte = new Date(startDate as string);
    if (endDate) createdAt.lte = new Date(endDate as string);

    const where: any = {
      OR: [
        { senderId: myId, receiverId: String(userId) },
        { senderId: String(userId), receiverId: myId },
      ],
      isDeleted: false,
      isExpired: false,
      ...(query ? { text: { contains: String(query), mode: "insensitive" } } : {}),
      ...(sender ? { senderId: sender === "me" ? myId : String(userId) } : {}),
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    };

    const results = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, fullName: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, profilePic: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    let filtered = results;
    if (fileType) {
      const ft = String(fileType).toLowerCase();
      filtered = results.filter((m: any) => {
        const f = m.file as any;
        const t = f && typeof f === "object" ? String(f.type ?? "") : "";
        return t.toLowerCase().includes(ft);
      });
    }

    res.status(200).json(toList(filtered as any[]));
  } catch (error: any) {
    console.log("Error in searchMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Aggregated shared media for the v3 media panel: images, videos, files + links
// for one DM thread, newest first. Single query, split in JS.
export const getSharedMedia = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    if (!isValidId(userId as string)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const rows = await prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: myId, receiverId: String(userId) },
              { senderId: String(userId), receiverId: myId },
            ],
          },
          { isDeleted: false },
          { isExpired: false },
          {
            OR: [
              { image: { not: null } },
              { file: { not: Prisma.DbNull } },
              { text: { contains: "http" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        senderId: true,
        text: true,
        image: true,
        file: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const linkRegex = /(https?:\/\/[^\s<]+[^.,:;"'!)\]\s])/;
    const images: any[] = [];
    const videos: any[] = [];
    const files: any[] = [];
    const links: any[] = [];

    for (const m of rows as any[]) {
      const f = (m.file ?? null) as { url?: string; name?: string; type?: string; size?: number } | null;
      const fType = f && typeof f.type === "string" ? f.type : "";
      const imgUrl = typeof m.image === "string" && m.image ? m.image : "";
      const fileUrl = f && typeof f.url === "string" && f.url ? f.url : "";

      if (fType.startsWith("video/") && fileUrl) {
        videos.push({ id: m.id, url: fileUrl, name: f?.name ?? "Video", type: fType, size: f?.size ?? 0, createdAt: m.createdAt, senderId: m.senderId });
      } else if ((fType.startsWith("image/") && fileUrl) || (imgUrl && !fileUrl)) {
        images.push({ id: m.id, url: fileUrl || imgUrl, name: f?.name ?? "Image", type: fType || "image", size: f?.size ?? 0, createdAt: m.createdAt, senderId: m.senderId });
      } else if (fileUrl) {
        files.push({ id: m.id, url: fileUrl, name: f?.name ?? "File", type: fType || "file", size: f?.size ?? 0, createdAt: m.createdAt, senderId: m.senderId });
      }

      if (typeof m.text === "string") {
        const match = m.text.match(linkRegex);
        if (match) {
          links.push({ id: m.id, url: match[0], createdAt: m.createdAt, senderId: m.senderId });
        }
      }
    }

    res.status(200).json({ images, videos, files, links });
  } catch (error: any) {
    console.log("Error in getSharedMedia: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setChatDisappearing = async (req: AuthRequest, res: Response): Promise<any> => {  try {
    const { userId } = req.params;
    const { expiryLabel, expiresAt } = req.body;
    const myId = meId(req);
    const me = await prisma.user.findUnique({ where: { id: myId } });
    if (!me) return res.status(404).json({ error: "User not found" });

    const settings = (((me.chatSettings as any) ?? {}) as Record<string, any>);
    settings[String(userId)] = {
      expiryLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };
    await prisma.user.update({
      where: { id: myId },
      data: { chatSettings: settings as any },
    });

    res.status(200).json({ expiryLabel, expiresAt });
  } catch (error: any) {
    console.log("Error in setChatDisappearing: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLockedChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const me = await prisma.user.findUnique({
      where: { id: myId },
      select: { lockedChats: true },
    });
    const lockedIds = me?.lockedChats || [];
    const chats = lockedIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: lockedIds } },
          select: { id: true, fullName: true, email: true, profilePic: true },
        })
      : [];
    res.status(200).json(toList(chats as any[]));
  } catch (error: any) {
    console.log("Error in getLockedChats: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const lockChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { pin } = req.body;
    const myId = meId(req);
    if (!pin || String(pin).length < 4) {
      return res.status(400).json({ error: "PIN must be at least 4 digits" });
    }

    const me = await prisma.user.findUnique({ where: { id: myId } });
    if (!me) return res.status(404).json({ error: "User not found" });

    const lockedChats = [...(me.lockedChats || [])];
    if (!lockedChats.includes(String(userId))) {
      lockedChats.push(String(userId));
    }
    const lockPins = (((me.lockPins as any) ?? {}) as Record<string, string>);
    lockPins[String(userId)] = hashPin(String(pin));
    await prisma.user.update({
      where: { id: myId },
      data: { lockedChats, lockPins: lockPins as any },
    });

    res.status(200).json({ locked: true });
  } catch (error: any) {
    console.log("Error in lockChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlockChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { pin } = req.body;
    const myId = meId(req);

    const me = await prisma.user.findUnique({ where: { id: myId } });
    if (!me) return res.status(404).json({ error: "User not found" });

    const lockPins = (((me.lockPins as any) ?? {}) as Record<string, string>);
    const storedHash = lockPins[String(userId)];
    if (!storedHash || storedHash !== hashPin(String(pin))) {
      return res.status(403).json({ error: "Invalid PIN" });
    }

    res.status(200).json({ unlocked: true });
  } catch (error: any) {
    console.log("Error in unlockChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markViewOnceOpened = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;

    if (!isValidId(messageId as string)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const message = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.viewOnce || message.viewedOnce) {
      return res.status(200).json(toResponse(message as any));
    }

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { viewedOnce: true, viewedAt: new Date() },
    });

    res.status(200).json(toResponse(updated as any));
  } catch (error: any) {
    console.log("Error in markViewOnceOpened: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward message
export const forwardMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { receiverId } = req.body;
    const senderId = meId(req);
    const sender = (req as any).user;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (!isValidId(messageId as string) || !isValidId(receiverId as string)) {
      return res.status(400).json({ error: "Invalid message or receiver ID" });
    }

    if (senderId === String(receiverId)) {
      return res.status(400).json({ error: "Cannot forward a message to yourself" });
    }

    // Check if users are friends (unless one is the Help Center)
    const helpCenterEmail = process.env.HELP_CENTER_EMAIL || "pansiluco@gmail.com";
    const isHelpCenterSender = sender?.email === helpCenterEmail;
    let isHelpCenterReceiver = false;

    const receiverUser = await prisma.user.findUnique({ where: { id: String(receiverId) } });
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    if (receiverUser.email === helpCenterEmail) {
      isHelpCenterReceiver = true;
    }

    if (!isHelpCenterSender && !isHelpCenterReceiver) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { requesterId: senderId, receiverId: String(receiverId) },
            { requesterId: String(receiverId), receiverId: senderId },
          ],
        },
      });

      if (!friendship) {
        return res.status(403).json({ error: "You can only message users you are friends with" });
      }
    }

    const originalMessage = await prisma.message.findUnique({ where: { id: String(messageId) } });
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const forwardedMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId: String(receiverId),
        text: originalMessage.text,
        image: originalMessage.image,
        file: (originalMessage.file as any) ?? undefined,
        forwardedFromId: originalMessage.id,
        isRead: false,
      },
    });

    const out = toResponse(forwardedMessage as any);

    const receiverSocketId = getReceiverSocketId(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", out);
    }

    res.status(201).json(out);
  } catch (error: any) {
    console.error("Error in forwardMessage: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user status
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, statusMessage } = req.body;
    const userId = meId(req);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: status as any,
        statusMessage: statusMessage || "",
        lastSeen: new Date(),
      },
    });

    // Broadcast status change
    io.emit("userStatusChanged", {
      userId,
      status,
      statusMessage,
    });

    const { password: _pw, ...safe } = updated as any;
    res.status(200).json(toResponse(safe as any));
  } catch (error: any) {
    console.log("Error in updateUserStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user status
export const getUserStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId as string)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, status: true, statusMessage: true, lastSeen: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(toResponse(user as any));
  } catch (error: any) {
    console.log("Error in getUserStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Archive chat
export const getCommunityData = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const myId = meId(req);
    const communities = await prisma.community.findMany({
      where: { OR: [{ ownerId: myId }, { admins: { has: myId } }] },
      select: { id: true },
    });
    const memberWorkspaces = await prisma.workspace.findMany({
      where: { members: { has: myId } },
      select: { id: true },
    });
    const wsIds = memberWorkspaces.map((w: any) => w.id);
    const channels = wsIds.length > 0
      ? await prisma.channel.findMany({
          where: { workspaceId: { in: wsIds } },
          select: { id: true },
        })
      : [];
    res.status(200).json({
      communityIds: communities.map((c: any) => c.id),
      subscribedChannels: channels.map((c: any) => c.id),
    });
  } catch (error: any) {
    console.log("Error in getCommunityData: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleArchiveChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    const user = await prisma.user.findUnique({ where: { id: myId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const archivedChats = [...(user.archivedChats || [])];
    const chatIndex = archivedChats.indexOf(String(userId));

    if (chatIndex > -1) {
      archivedChats.splice(chatIndex, 1);
    } else {
      archivedChats.push(String(userId));
    }

    await prisma.user.update({ where: { id: myId }, data: { archivedChats } });
    res.status(200).json({ archived: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in toggleArchiveChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin chat
export const togglePinChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    const user = await prisma.user.findUnique({ where: { id: myId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const pinnedChats = [...(user.pinnedChats || [])];
    const chatIndex = pinnedChats.indexOf(String(userId));

    if (chatIndex > -1) {
      pinnedChats.splice(chatIndex, 1);
    } else {
      pinnedChats.push(String(userId));
    }

    await prisma.user.update({ where: { id: myId }, data: { pinnedChats } });
    res.status(200).json({ pinned: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in togglePinChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mute chat
export const toggleMuteChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    const user = await prisma.user.findUnique({ where: { id: myId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const mutedChats = [...(user.mutedChats || [])];
    const chatIndex = mutedChats.indexOf(String(userId));

    if (chatIndex > -1) {
      mutedChats.splice(chatIndex, 1);
    } else {
      mutedChats.push(String(userId));
    }

    await prisma.user.update({ where: { id: myId }, data: { mutedChats } });
    res.status(200).json({ muted: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in toggleMuteChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clear chat history
export const clearChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = meId(req);

    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: myId, receiverId: String(userId) },
          { senderId: String(userId), receiverId: myId },
        ],
      },
    });

    // Emit to other user
    const otherUserSocketId = getReceiverSocketId(String(userId));
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("chatCleared");
    }

    res.status(200).json({ message: "Chat history cleared" });
  } catch (error: any) {
    console.log("Error in clearChatHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update theme
export const updateTheme = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { theme } = req.body;
    const userId = meId(req);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { theme },
    });

    const { password: _pw, ...safe } = updated as any;
    res.status(200).json(toResponse(safe as any));
  } catch (error: any) {
    console.log("Error in updateTheme: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Set chat background
export const setChatBackground = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { chatUserId, backgroundUrl } = req.body;
    const userId = meId(req);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const settings = (((user.chatSettings as any) ?? {}) as Record<string, any>);
    settings[`background:${String(chatUserId)}`] = backgroundUrl;
    await prisma.user.update({
      where: { id: userId },
      data: { chatSettings: settings as any },
    });

    res.status(200).json({ message: "Background updated" });
  } catch (error: any) {
    console.log("Error in setChatBackground: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export chat history
export const exportChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { format = 'json', includeDeleted = false } = req.query as { format?: string; includeDeleted?: string | boolean };
    const loggedInUserId = meId(req);

    if (!isValidId(userId as string)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const includeDel = includeDeleted === 'true' || includeDeleted === true;

    // Get messages between these users (paginated, max 500)
    const where: any = {
      OR: [
        { senderId: loggedInUserId, receiverId: String(userId) },
        { senderId: String(userId), receiverId: loggedInUserId },
      ],
      ...(includeDel ? {} : { isDeleted: false }),
    };
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 500,
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
        receiver: { select: { id: true, fullName: true, email: true } },
        replyTo: { select: { id: true, text: true, senderId: true } },
      },
    });

    // Get user info for the chat
    const chatUser = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, fullName: true, email: true },
    });
    if (!chatUser) return res.status(404).json({ error: "Chat partner not found" });

    const fwdIds = [...new Set(messages.map((m: any) => m.forwardedFromId).filter((v: any): v is string => !!v))];
    const fwdRows = fwdIds.length > 0
      ? await prisma.message.findMany({
          where: { id: { in: fwdIds } },
          select: { id: true, text: true, senderId: true },
        })
      : [];
    const fwdMap = new Map(fwdRows.map((m: any) => [m.id, m]));

    const chatWith = toResponse(chatUser as any) as any;
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      chatWith: {
        id: chatWith._id,
        name: chatUser.fullName,
        email: chatUser.email,
      },
      totalMessages: messages.length,
      messages: messages.map((msg: any) => {
        const r = toResponse(msg as any) as any;
        const snd = msg.sender as any;
        const replyTo = msg.replyTo as any;
        const fwd = msg.forwardedFromId ? (fwdMap.get(msg.forwardedFromId) as any) : null;
        return {
          id: r._id,
          timestamp: msg.createdAt,
          sender: snd
            ? { id: snd.id, name: snd.fullName, email: snd.email }
            : { id: msg.senderId, name: "Unknown", email: "" },
          text: msg.text,
          image: msg.image,
          file: msg.file,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          editHistory: msg.editHistory,
          isDeleted: msg.isDeleted,
          deletedAt: msg.deletedAt,
          isPinned: msg.isPinned,
          pinnedAt: msg.pinnedAt,
          reactions: ((msg.reactions as any) ?? {}),
          replyTo: replyTo ? {
            id: replyTo.id,
            text: replyTo.text,
            sender: replyTo.senderId,
          } : null,
          forwardedFrom: fwd ? {
            id: fwd.id,
            text: fwd.text,
            sender: fwd.senderId,
          } : null,
          isRead: msg.isRead,
          readAt: msg.readAt,
        };
      }),
    };

    // Format the response based on requested format
    if (format === 'text') {
      const textContent = formatChatAsText(exportData);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.txt"`);
      return res.send(textContent);
    }

    if (format === 'csv') {
      const csvContent = formatChatAsCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.json"`);
    res.json(exportData);

  } catch (error: any) {
    console.log("Error in exportChat: ", error.message);
    res.status(500).json({ error: "Failed to export chat" });
  }
};

// Helper function to format chat as text
function formatChatAsText(data: any): string {
  let text = `Chat Export - ${data.chatWith.name}\n`;
  text += `Exported on: ${new Date(data.exportedAt).toLocaleString()}\n`;
  text += `Total messages: ${data.totalMessages}\n\n`;
  text += '='.repeat(50) + '\n\n';

  data.messages.forEach((msg: any) => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const sender = msg.sender.name;
    const isEdited = msg.isEdited ? ' (edited)' : '';
    const isDeleted = msg.isDeleted ? ' (deleted)' : '';

    text += `[${timestamp}] ${sender}${isEdited}${isDeleted}:\n`;

    if (msg.text) {
      text += `${msg.text}\n`;
    }

    if (msg.image) {
      text += `[Image: ${msg.image}]\n`;
    }

    if (msg.file) {
      text += `[File: ${msg.file.name} (${msg.file.size} bytes)]\n`;
    }

    if (msg.replyTo) {
      text += `┌─ Replying to: "${msg.replyTo.text}"\n`;
    }

    if (msg.forwardedFrom) {
      text += `┌─ Forwarded from: ${msg.forwardedFrom.sender}\n`;
    }

    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
      const reactions = Object.entries(msg.reactions)
        .map(([emoji, users]: any) => `${emoji}(${users.length})`)
        .join(' ');
      text += `Reactions: ${reactions}\n`;
    }

    if (msg.isPinned) {
      text += '📌 Pinned message\n';
    }

    text += '\n';
  });

  return text;
}

// Helper function to format chat as CSV
function formatChatAsCSV(data: any): string {
  let csv = 'Timestamp,Sender,Message,Image,File,IsEdited,IsDeleted,IsPinned,Reactions,ReplyTo,ForwardedFrom\n';

  data.messages.forEach((msg: any) => {
    const timestamp = new Date(msg.timestamp).toISOString();
    const sender = msg.sender.name;
    const text = msg.text ? `"${msg.text.replace(/"/g, '""')}"` : '';
    const image = msg.image || '';
    const file = msg.file ? `${msg.file.name} (${msg.file.size} bytes)` : '';
    const isEdited = msg.isEdited ? 'Yes' : 'No';
    const isDeleted = msg.isDeleted ? 'Yes' : 'No';
    const isPinned = msg.isPinned ? 'Yes' : 'No';
    const reactions = msg.reactions ? Object.entries(msg.reactions).map
    (([emoji, users]: any) => `${emoji}(${users.length})`).join('; ') : '';
    const replyTo = msg.replyTo ? `"${msg.replyTo.text?.replace(/"/g, '""') || ''}"`:'';
    const forwardedFrom = msg.forwardedFrom ? msg.forwardedFrom.sender || '' : '';

    csv += `${timestamp},${sender},${text},${image},${file},${isEdited},${isDeleted},${isPinned},"${reactions}",${replyTo},${forwardedFrom}\n`;
  });

  return csv;
}
