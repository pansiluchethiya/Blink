import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { prisma, toResponse, isValidId } from "../lib/prisma.js";
import { io } from "../lib/socket.js";

const meId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

const senderMiniSelect = {
  id: true,
  fullName: true,
  email: true,
  profilePic: true,
  status: true,
} as const;

export const shapeWorkspaceMessage = (m: any) => {
  if (!m) return m;
  const { id, sender, replyTo, ...rest } = m;
  const out: any = { ...rest, _id: id, id };
  if (sender && typeof sender === "object" && (sender as any).id) {
    out.senderId = toResponse(sender as any);
  }
  if (replyTo && typeof replyTo === "object" && (replyTo as any).id) {
    const { id: rid, sender: rSender, ...rRest } = replyTo as any;
    const shapedReply: any = { ...rRest, _id: rid, id: rid };
    if (rSender && typeof rSender === "object" && (rSender as any).id) {
      shapedReply.senderId = toResponse(rSender as any);
    }
    out.replyTo = shapedReply;
  }
  if (!out.reactions || typeof out.reactions !== "object") out.reactions = {};
  return out;
};

export const togglePinWorkspaceMessage = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { messageId } = req.params;
    const userId = meId(req);

    if (!isValidId(messageId as string)) return next(new AppError("Message not found", 404));

    const message = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
    });
    if (!message) return next(new AppError("Message not found", 404));

    const nextPinned = !message.isPinned;
    const updated = await prisma.workspaceMessage.update({
      where: { id: String(messageId) },
      data: {
        isPinned: nextPinned,
        pinnedAt: nextPinned ? new Date() : null,
        pinnedBy: nextPinned ? userId : null,
      },
      include: { sender: { select: senderMiniSelect }, replyTo: true },
    });

    const shaped = shapeWorkspaceMessage(updated);

    io.to(message.workspaceId.toString()).emit("workspaceMessagePinToggled", {
      messageId,
      isPinned: updated.isPinned,
      workspaceId: message.workspaceId,
      channelId: message.channelId,
      message: shaped,
    });

    res.status(200).json(shaped);
  }
);
