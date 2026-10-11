import { Response } from "express";
import { prisma, toResponse } from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string => String((req as any).user?._id ?? (req as any).user?.id);

const peerSelect = {
  id: true,
  fullName: true,
  username: true,
  handle: true,
  profilePic: true,
} as const;

const shapeLog = (l: any) => ({
  ...toResponse(l),
  caller: l.caller ? toResponse(l.caller) : null,
  receiver: l.receiver ? toResponse(l.receiver) : null,
});

// Recent calls involving me, newest first.
export const getCallRecents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const logs = await prisma.callLog.findMany({
      where: { OR: [{ callerId: myId }, { receiverId: myId }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        caller: { select: peerSelect },
        receiver: { select: peerSelect },
      },
    });
    res.status(200).json(logs.map(shapeLog));
  } catch (error: any) {
    console.error("Error in getCallRecents:", error.message);
    res.status(500).json({ error: "Internal server error fetching calls" });
  }
};

// Written by either party when a call ends (or is missed/declined).
export const logCall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = meId(req);
    const { peerId, type, status, durationSec } = req.body ?? {};
    if (!peerId || !["voice", "video"].includes(String(type)) || !["answered", "missed", "declined"].includes(String(status))) {
      res.status(400).json({ error: "peerId, type (voice|video) and status (answered|missed|declined) are required" });
      return;
    }
    const peer = await prisma.user.findUnique({ where: { id: String(peerId) } });
    if (!peer) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const log = await prisma.callLog.create({
      data: {
        callerId: myId,
        receiverId: String(peerId),
        type: String(type),
        status: String(status),
        durationSec: Math.max(0, Number(durationSec) || 0),
        endedAt: new Date(),
      },
      include: {
        caller: { select: peerSelect },
        receiver: { select: peerSelect },
      },
    });
    res.status(201).json(shapeLog(log));
  } catch (error: any) {
    console.error("Error in logCall:", error.message);
    res.status(500).json({ error: "Internal server error logging call" });
  }
};
