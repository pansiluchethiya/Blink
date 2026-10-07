import express, { Response } from "express";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
  deleteNotification,
  updatePreferences,
} from "../controllers/notification.controller.js";
import webpush from "web-push";
import { prisma } from "../lib/prisma.js";

const uid = (req: AuthRequest): string => String((req as any).user?._id ?? (req as any).user?.id);

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    "mailto:support@Blink-chat.com",
    PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY
  );
} else {
  console.warn("VAPID keys are not set. Push notifications will not work.");
}

const router = express.Router();

router.get("/push/key", protectRoute, (req: AuthRequest, res: Response) => {
  res.json({ publicKey: PUBLIC_VAPID_KEY });
});

router.post("/push/subscribe", protectRoute, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = req.body;
    if (req.user) {
      await prisma.user.update({ where: { id: uid(req) }, data: { pushSubscription: subscription as any } });
    }
    res.status(201).json({ message: "Subscribed" });
  } catch (error) {
    console.error("Error in push subscription route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const sendPushNotification = async (userId: string, payload: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(userId) } });
    const subscription = (user as any)?.pushSubscription;
    if (subscription) {
      webpush.sendNotification(subscription, JSON.stringify(payload)).catch(async (err: any) => {
        console.error("Error sending web push:", err?.message || err);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.user.update({ where: { id: String(userId) }, data: { pushSubscription: undefined } }).catch(() => {});
        }
      });
    }
  } catch (error) {
    console.error("Error in sendPushNotification service:", error);
  }
};

router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.patch("/:id/read", protectRoute, markAsRead);
router.patch("/read-all", protectRoute, markAllAsRead);
router.delete("/read", protectRoute, deleteReadNotifications);
router.delete("/:id", protectRoute, deleteNotification);
router.patch("/preferences", protectRoute, updatePreferences);

export default router;
