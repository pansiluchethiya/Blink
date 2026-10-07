import { Response, NextFunction } from "express";
import webpush from "web-push";
import { prisma, toResponse, isValidId } from "../lib/prisma.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const getUserId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

const actorSelect = { id: true, fullName: true, profilePic: true } as const;

const formatNotification = (n: any) => {
  const out: any = toResponse(n as { id: string });
  if (n.actor && typeof n.actor === "object" && (n.actor as any).id) {
    out.actor = toResponse((n.actor as any) as { id: string });
  }
  if (out.recipient === undefined && out.recipientId !== undefined) {
    out.recipient = out.recipientId;
  }
  return out;
};

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
  try {
    webpush.setVapidDetails("mailto:support@Blink-chat.com", PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
  } catch {
    // ignore — keys may be invalid in test env
  }
} else {
  console.warn("VAPID keys are not set. Push notifications will not work.");
}

export const sendPushNotification = async (userId: string, payload: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { pushSubscription: true },
    });
    const subscription = user?.pushSubscription as any;
    if (!subscription?.endpoint) return;
    webpush.sendNotification(subscription, JSON.stringify(payload)).catch(async (err: any) => {
      console.error("Error sending web push:", err?.message || err);
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        try {
          await prisma.user.update({
            where: { id: String(userId) },
            data: { pushSubscription: null } as any,
          });
        } catch {
          // ignore cleanup failure
        }
      }
    });
  } catch (error) {
    console.error("Error in sendPushNotification service:", error);
  }
};

export const deleteOldNotifications = async (): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.notification.deleteMany({
      where: {
        OR: [{ createdAt: { lte: sevenDaysAgo } }, { isRead: true, updatedAt: { lte: sevenDaysAgo } }],
      },
    });

    if (deleted.count > 0) {
      console.log(`Cleaned up ${deleted.count} old notifications`);
    }
  } catch (error: any) {
    console.error("Error cleaning up old notifications:", error.message);
  }
};

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { page = "1", limit = "20", unreadOnly = "false" } = req.query as {
    page?: string;
    limit?: string;
    unreadOnly?: string;
  };

  await deleteOldNotifications();

  const take = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 50);
  const pageNum = Math.max(parseInt(String(page)) || 1, 1);

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(unreadOnly === "true" ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip: (pageNum - 1) * take,
    take,
    include: { actor: { select: actorSelect } },
  });

  res.status(200).json(notifications.map(formatNotification));
});

export const getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const count = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  res.status(200).json({ count });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = getUserId(req);

  if (!isValidId(id)) {
    return next(new AppError("Notification not found", 404));
  }

  const existing = await prisma.notification.findFirst({ where: { id: String(id), recipientId: userId } });
  if (!existing) {
    return next(new AppError("Notification not found", 404));
  }

  const notification = await prisma.notification.update({
    where: { id: String(id) },
    data: { isRead: true },
    include: { actor: { select: actorSelect } },
  });

  const unreadCount = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  const receiverSocketId = getReceiverSocketId(userId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification:count-update", unreadCount);
    io.to(receiverSocketId).emit("notification:read", id);
  }

  res.status(200).json(formatNotification(notification));
});

export const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);

  await prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true } });

  const receiverSocketId = getReceiverSocketId(userId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification:count-update", 0);
    io.to(receiverSocketId).emit("notification:all-read");
  }

  res.status(200).json({ message: "All notifications marked as read" });
});

export const deleteReadNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const deleted = await prisma.notification.deleteMany({ where: { recipientId: userId, isRead: true } });

  const receiverSocketId = getReceiverSocketId(userId);
  if (receiverSocketId) {
    const unreadCount = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });
    io.to(receiverSocketId).emit("notification:count-update", unreadCount);
    io.to(receiverSocketId).emit("notification:read-cleared");
  }

  res.status(200).json({ message: "Read notifications deleted", deletedCount: deleted.count });
});

export const deleteNotification = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = getUserId(req);

  if (!isValidId(id)) {
    return next(new AppError("Notification not found", 404));
  }

  const existing = await prisma.notification.findFirst({ where: { id: String(id), recipientId: userId } });
  if (!existing) {
    return next(new AppError("Notification not found", 404));
  }

  await prisma.notification.delete({ where: { id: String(id) } });

  const unreadCount = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  const receiverSocketId = getReceiverSocketId(userId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification:count-update", unreadCount);
    io.to(receiverSocketId).emit("notification:deleted", id);
  }

  res.status(200).json({ message: "Notification deleted" });
});

export const updatePreferences = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { preferences } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { notificationPreferences: preferences } as any,
    select: { notificationPreferences: true },
  });

  res.status(200).json(user?.notificationPreferences);
});

export const subscribePush = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const subscription = req.body;

  if (!subscription?.endpoint) {
    res.status(400).json({ error: "Invalid push subscription" });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { pushSubscription: subscription } as any,
  });

  res.status(201).json({ message: "Subscribed" });
});

export const unsubscribePush = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);

  await prisma.user.update({
    where: { id: userId },
    data: { pushSubscription: null } as any,
  });

  res.status(200).json({ message: "Unsubscribed" });
});

// Aliases for route flexibility
export const subscribe = subscribePush;
export const unsubscribe = unsubscribePush;

export const sendTestNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { title = "Test notification", body = "Push notifications are working!" } = (req.body ?? {}) as {
    title?: string;
    body?: string;
  };

  const created = await prisma.notification.create({
    data: {
      recipientId: userId,
      actorId: userId,
      type: "announcement",
      title: String(title),
      body: String(body),
    },
    include: { actor: { select: actorSelect } },
  });

  const out = formatNotification(created);

  const receiverSocketId = getReceiverSocketId(userId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification:new", out);
    const unreadCount = await prisma.notification.count({ where: { recipientId: userId, isRead: false } });
    io.to(receiverSocketId).emit("notification:count-update", unreadCount);
  }

  await sendPushNotification(userId, { title: String(title), body: String(body), url: "/" }).catch(() => {});

  res.status(201).json(out);
});
