import { prisma, toResponse } from "../lib/prisma.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { sendPushNotification } from "../routes/notification.route.js";

interface NotificationData {
  recipient: string;
  actor: string;
  type: "direct_message" | "group_message" | "mention" | "reply" | "friend_request" | "friend_accept" | "follow" | "reaction" | "welcome" | "announcement" | "security";
  title: string;
  body: string;
  metadata?: any;
}

class NotificationService {
  async createNotification({ recipient, actor, type, title, body, metadata }: NotificationData) {
    try {
      const user = await prisma.user.findUnique({ where: { id: String(recipient) } });
      if (!user) return null;

      const prefs = (user.notificationPreferences as any) || {};
      let shouldNotify = true;
      if (type === "direct_message" && prefs.directMessages === false) shouldNotify = false;
      if (type === "mention" && prefs.mentions === false) shouldNotify = false;
      if (type === "group_message" && prefs.workspaceActivity === false) shouldNotify = false;

      if (!shouldNotify) return null;

      const notification = await prisma.notification.create({
        data: {
          recipientId: String(recipient),
          actorId: String(actor),
          type: type as any,
          title,
          body,
          metadata: metadata ?? undefined,
        },
        include: { actor: { select: { id: true, fullName: true, profilePic: true } } },
      });

      const out = toResponse(notification as any);
      const receiverSocketId = getReceiverSocketId(String(recipient));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("notification:new", out);
        const unreadCount = await prisma.notification.count({ where: { recipientId: String(recipient), isRead: false } });
        io.to(receiverSocketId).emit("notification:count-update", unreadCount);
      }

      sendPushNotification(String(recipient), {
        title,
        body,
        url: metadata?.conversationId ? `/?chat=${metadata.conversationId}` : "/",
      }).catch(() => {});

      return out;
    } catch (error: any) {
      console.log("Error in NotificationService.createNotification", error.message);
      return null;
    }
  }

  async sendWelcomeNotification(userId: string) {
    return this.createNotification({
      recipient: String(userId),
      actor: String(userId),
      type: "welcome",
      title: "Welcome to Blink!",
      body: "We're glad you're here. Start chatting with your friends!",
    });
  }
}

export default new NotificationService();
