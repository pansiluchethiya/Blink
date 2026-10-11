import { prisma, toResponse } from "../lib/prisma.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { sendPushNotification } from "../controllers/notification.controller.js";

const actorSelect = { id: true, fullName: true, profilePic: true } as const;

const isBirthdayOn = (d: Date, target: Date) =>
  d.getUTCMonth() === target.getUTCMonth() && d.getUTCDate() === target.getUTCDate();

/**
 * Birthday reminders: for each user whose birthday falls in 2 days, 1 day,
 * or today, notify their accepted friends (in-app + push). Minors' notices
 * only go to mutual friends — which the accepted-friendship query already is.
 * Runs daily via node-cron (see index.ts).
 */
export const sendBirthdayReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const targets = [2, 1, 0].map((daysAhead) => {
      const t = new Date(now);
      t.setUTCDate(t.getUTCDate() + daysAhead);
      return { daysAhead, date: t };
    });

    // Narrow window: users with any birthday set (birthdays are sparse).
    const candidates = await prisma.user.findMany({
      where: { birthday: { not: null } },
      select: { id: true, fullName: true, birthday: true },
    });
    if (candidates.length === 0) return;

    for (const { daysAhead, date } of targets) {
      const celebrants = candidates.filter((c) => c.birthday && isBirthdayOn(c.birthday, date));
      if (celebrants.length === 0) continue;

      for (const c of celebrants) {
        const friendships = await prisma.friendship.findMany({
          where: {
            status: "accepted",
            OR: [{ requesterId: c.id }, { receiverId: c.id }],
          },
          select: { requesterId: true, receiverId: true },
        });
        const friendIds = friendships.map((f) =>
          String(f.requesterId) === String(c.id) ? String(f.receiverId) : String(f.requesterId)
        );
        if (friendIds.length === 0) continue;

        const firstName = c.fullName.split(" ")[0];
        const title =
          daysAhead === 0
            ? `🎂 ${firstName}'s birthday is today!`
            : `🎂 ${firstName}'s birthday is in ${daysAhead} day${daysAhead === 1 ? "" : "s"}`;
        const body =
          daysAhead === 0
            ? "Send them a message to celebrate!"
            : "Get a message ready to celebrate!";

        for (const friendId of friendIds) {
          try {
            const created: any = await prisma.notification.create({
              data: {
                recipientId: friendId,
                actorId: c.id,
                type: "birthday",
                title,
                body,
                metadata: { celebrantId: c.id, daysAhead },
              },
              include: { actor: { select: actorSelect } },
            });
            const out: any = toResponse(created as { id: string });
            if (created.actor) out.actor = toResponse(created.actor as { id: string });

            const sockets = getReceiverSocketId(friendId);
            if (sockets && sockets.length > 0) {
              io.to(sockets).emit("notification:new", out);
              const unreadCount = await prisma.notification.count({
                where: { recipientId: friendId, isRead: false },
              });
              io.to(sockets).emit("notification:count-update", unreadCount);
            }
            await sendPushNotification(friendId, { title, body, url: "/" }).catch(() => {});
          } catch {
            /* one friend failing must not stop the rest */
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in sendBirthdayReminders:", error);
  }
};
