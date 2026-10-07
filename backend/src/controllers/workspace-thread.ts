import { Response, NextFunction } from "express";
import { prisma, isValidId } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { shapeWorkspaceMessage } from "./workspace-pin.js";

const meId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

const senderMiniSelect = {
  id: true,
  fullName: true,
  email: true,
  profilePic: true,
  status: true,
} as const;

const isWorkspaceMember = (ws: { members: string[]; ownerId: string }, userId: string): boolean =>
  (ws.members ?? []).includes(userId) || ws.ownerId === userId;

// Get messages in a thread
export const getThreadMessages = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { messageId } = req.params;

    if (!isValidId(messageId as string)) return next(new AppError("Message not found", 404));

    const messages = await prisma.workspaceMessage.findMany({
      where: { threadId: String(messageId) },
      include: { sender: { select: senderMiniSelect } },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json(messages.map(shapeWorkspaceMessage));
  }
);

// Reply in a thread
export const replyInThread = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { messageId } = req.params;
    const { text, image, file } = req.body ?? {};
    const senderId = meId(req);

    if (!isValidId(messageId as string)) return next(new AppError("Parent message not found", 404));

    const parentMessage = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
    });
    if (!parentMessage) return next(new AppError("Parent message not found", 404));

    const ws = await prisma.workspace.findUnique({
      where: { id: parentMessage.workspaceId },
    });
    if (!ws) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(ws as any, senderId)) {
      return next(new AppError("You are not a member of this workspace", 403));
    }

    // Determine threadId: either the parent's threadId (if it's already in a thread) or the parent message's own ID
    const threadId = parentMessage.threadId ?? parentMessage.id;

    let imageUrl: string | undefined = typeof image === "string" ? image : undefined;
    let fileData: any = file ?? undefined;
    const uploadedFile = (req as any).file;
    if (uploadedFile) {
      const uploadResponse = await cloudinary.uploader.upload(
        `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString("base64")}`,
        {
          resource_type: "auto",
          public_id: `workspace_file_${Date.now()}_${uploadedFile.originalname}`,
        }
      );
      fileData = {
        url: uploadResponse.secure_url,
        name: uploadedFile.originalname,
        type: uploadedFile.mimetype,
        size: uploadedFile.size,
      };
    }

    const reply = await prisma.workspaceMessage.create({
      data: {
        senderId,
        workspaceId: parentMessage.workspaceId,
        channelId: parentMessage.channelId,
        text: typeof text === "string" ? text : "",
        image: imageUrl ?? "",
        file: fileData ?? undefined,
        threadId,
        replyToId: String(messageId),
      },
    });

    // Increment thread reply count on thread root
    try {
      await prisma.workspaceMessage.update({
        where: { id: threadId },
        data: { threadReplyCount: { increment: 1 } },
      });
    } catch {
      // root may have been deleted concurrently; ignore
    }

    const populated = await prisma.workspaceMessage.findUnique({
      where: { id: reply.id },
      include: { sender: { select: senderMiniSelect } },
    });

    const shaped = shapeWorkspaceMessage(populated);

    io.to(parentMessage.workspaceId.toString()).emit("newThreadMessage", {
      threadId,
      message: shaped,
    });

    res.status(201).json(shaped);
  }
);
