import { Response, NextFunction } from "express";
import { prisma, toResponse, isValidId } from "../lib/prisma.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import NotificationService from "../services/notification.service.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const meId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  profilePic: true,
  status: true,
  statusMessage: true,
  lastSeen: true,
} as const;

const friendshipInclude = {
  requester: { select: userSelect },
  receiver: { select: userSelect },
} as const;

// Prisma returns relations as `requester` / `receiver`; the frontend expects
// populated `requesterId` / `receiverId` user objects (mongoose shape).
const formatFriendship = (f: any) => {
  const requester = f?.requester ? toResponse(f.requester as any) : f?.requesterId;
  const receiver = f?.receiver ? toResponse(f.receiver as any) : f?.receiverId;
  const { requester: _r, receiver: _v, ...rest } = f ?? {};
  void _r;
  void _v;
  return {
    ...(toResponse(rest as any) as any),
    requesterId: requester,
    receiverId: receiver,
    requester,
    receiver,
  };
};

const isUniqueViolation = (err: any): boolean =>
  err?.code === "P2002" ||
  String(err?.message ?? "").includes("Unique constraint failed");

// Send Friend Request
export const sendRequest = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { receiverId } = req.body;
  const requesterId = meId(req);

  if (!receiverId) {
    return next(new AppError("Receiver ID is required", 400));
  }

  if (!isValidId(receiverId)) {
    return next(new AppError("Invalid Receiver ID", 400));
  }

  if (requesterId === String(receiverId)) {
    return next(new AppError("You cannot send a friend request to yourself", 400));
  }

  const receiverExists = await prisma.user.findUnique({
    where: { id: String(receiverId) },
    select: { id: true },
  });
  if (!receiverExists) {
    return next(new AppError("Receiver not found", 404));
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, receiverId: String(receiverId) },
        { requesterId: String(receiverId), receiverId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") {
      return next(new AppError("You are already friends with this user", 400));
    }
    if (existing.status === "pending") {
      if (existing.requesterId === requesterId) {
        return next(new AppError("Friend request already sent", 400));
      } else {
        return next(new AppError("You already have a pending friend request from this user", 400));
      }
    }
    if (existing.status === "blocked") {
      if (existing.requesterId === requesterId) {
        return next(new AppError("You have blocked this user", 400));
      } else {
        return next(new AppError("Unable to send friend request", 400));
      }
    }
  }

  let created: any;
  try {
    created = await prisma.friendship.create({
      data: {
        requesterId,
        receiverId: String(receiverId),
        status: "pending",
      },
      include: { ...friendshipInclude },
    });
  } catch (err: any) {
    if (isUniqueViolation(err)) {
      return next(new AppError("Friend request already exists", 400));
    }
    throw err;
  }

  const populated = formatFriendship(created);

  await NotificationService.createNotification({
    recipient: String(receiverId),
    actor: requesterId,
    type: "friend_request",
    title: "New Friend Request",
    body: `${(req as any).user?.fullName} sent you a friend request.`,
    metadata: {
      conversationId: requesterId,
    },
  });

  const receiverSocketId = getReceiverSocketId(String(receiverId));
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("friendRequestReceived", populated);
  }

  res.status(201).json(populated);
});

// Accept Friend Request
export const acceptRequest = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { requesterId } = req.body;
  const receiverId = meId(req);

  if (!requesterId) {
    return next(new AppError("Requester ID is required", 400));
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      requesterId: String(requesterId),
      receiverId,
      status: "pending",
    },
  });

  if (!friendship) {
    return next(new AppError("Pending friend request not found", 404));
  }

  const updated = await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "accepted" },
    include: { ...friendshipInclude },
  });

  const populated = formatFriendship(updated);

  await NotificationService.createNotification({
    recipient: String(requesterId),
    actor: receiverId,
    type: "friend_accept",
    title: "Friend Request Accepted",
    body: `${(req as any).user?.fullName} accepted your friend request.`,
    metadata: {
      conversationId: receiverId,
    },
  });

  const senderSocketId = getReceiverSocketId(String(requesterId));
  if (senderSocketId) {
    io.to(senderSocketId).emit("friendRequestAccepted", {
      friendshipId: friendship.id,
      user: {
        _id: (req as any).user?._id ?? (req as any).user?.id,
        fullName: (req as any).user?.fullName,
        email: (req as any).user?.email,
        profilePic: (req as any).user?.profilePic,
        status: (req as any).user?.status,
        statusMessage: (req as any).user?.statusMessage,
        lastSeen: (req as any).user?.lastSeen,
      },
    });
  }

  res.status(200).json(populated);
});

// Decline Friend Request
export const declineRequest = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { requesterId } = req.body;
  const receiverId = meId(req);

  if (!requesterId) {
    return next(new AppError("Requester ID is required", 400));
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      requesterId: String(requesterId),
      receiverId,
      status: "pending",
    },
  });

  if (!friendship) {
    return next(new AppError("Pending friend request not found", 404));
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });

  const senderSocketId = getReceiverSocketId(String(requesterId));
  if (senderSocketId) {
    io.to(senderSocketId).emit("friendRequestDeclined", {
      requesterId,
      receiverId,
    });
  }

  res.status(200).json({ message: "Friend request declined successfully" });
});

// Block User
export const blockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.body;
  const myId = meId(req);

  if (!userId) {
    return next(new AppError("User ID to block is required", 400));
  }

  if (!isValidId(String(userId))) {
    return next(new AppError("Invalid User ID", 400));
  }

  if (myId === String(userId)) {
    return next(new AppError("You cannot block yourself", 400));
  }

  const target = await prisma.user.findUnique({
    where: { id: String(userId) },
    select: { id: true },
  });
  if (!target) {
    return next(new AppError("User not found", 404));
  }

  // Remove any existing rows between the pair first so the single
  // (myId -> userId, blocked) row can never hit the @@unique constraint.
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: myId, receiverId: String(userId) },
        { requesterId: String(userId), receiverId: myId },
      ],
    },
  });

  let friendship: any;
  try {
    friendship = await prisma.friendship.create({
      data: {
        requesterId: myId,
        receiverId: String(userId),
        status: "blocked",
      },
      include: { ...friendshipInclude },
    });
  } catch (err: any) {
    if (isUniqueViolation(err)) {
      return next(new AppError("User is already blocked", 400));
    }
    throw err;
  }

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { blockedUsers: true },
  });
  const blockedUsers = Array.from(new Set([...(me?.blockedUsers ?? []), String(userId)]));
  await prisma.user.update({
    where: { id: myId },
    data: { blockedUsers },
  });

  res.status(200).json(formatFriendship(friendship));
});

// Unblock User
export const unblockUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.body;
  const myId = meId(req);

  if (!userId) {
    return next(new AppError("User ID to unblock is required", 400));
  }

  if (!isValidId(String(userId))) {
    return next(new AppError("Invalid User ID", 400));
  }

  await prisma.friendship.deleteMany({
    where: {
      requesterId: myId,
      receiverId: String(userId),
      status: "blocked",
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { blockedUsers: true },
  });
  if (me) {
    await prisma.user.update({
      where: { id: myId },
      data: { blockedUsers: (me.blockedUsers ?? []).filter((id: string) => id !== String(userId)) },
    });
  }

  res.status(200).json({ message: "User unblocked successfully" });
});

// Get Friend List
export const getFriends = catchAsync(async (req: AuthRequest, res: Response) => {
  const myId = meId(req);

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: myId }, { receiverId: myId }],
    },
    include: { ...friendshipInclude },
  });

  const friends = friendships.map((f: any) => {
    const other = f.requesterId === myId ? f.receiver : f.requester;
    return toResponse(other as any);
  });

  res.status(200).json(friends);
});

// Get Pending Requests
export const getPendingRequests = catchAsync(async (req: AuthRequest, res: Response) => {
  const myId = meId(req);

  const incoming = await prisma.friendship.findMany({
    where: { receiverId: myId, status: "pending" },
    include: { ...friendshipInclude },
  });

  const outgoing = await prisma.friendship.findMany({
    where: { requesterId: myId, status: "pending" },
    include: { ...friendshipInclude },
  });

  res.status(200).json({
    incoming: incoming.map(formatFriendship),
    outgoing: outgoing.map(formatFriendship),
  });
});
