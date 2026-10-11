import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5001",
      "https://blink.koyeb.app",
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    credentials: true,
  },
});

// Multi-device: one user may hold several socket ids (phone + desktop + tabs).
const userSocketMap: Record<string, Set<string>> = {}; // {userId: Set<socketId>}
const userStatusMap: Record<string, string> = {}; // {userId: status}

export function getReceiverSocketId(userId: string): string[] {
  return userSocketMap[userId] ? Array.from(userSocketMap[userId]) : [];
}

function resolveUserId(socket: Socket): string | undefined {
  // Prefer a verified JWT (handshake.auth.token); fall back to the legacy
  // query.userId so older clients keep working.
  const token = (socket.handshake.auth as any)?.token as string | undefined;
  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      if (decoded?.userId) return String(decoded.userId);
    } catch {
      // fall through to legacy query param
    }
  }
  const q = socket.handshake.query.userId as string | undefined;
  return q ? String(q) : undefined;
}

io.on("connection", (socket: Socket) => {
  console.log("A user connected", socket.id);

  const userId = resolveUserId(socket);
  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
    userStatusMap[userId] = "online";
    socket.data.userId = userId;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", (receiverId: string) => {
    const ids = getReceiverSocketId(receiverId);
    if (ids.length) io.to(ids).emit("userTyping", userId);
  });

  socket.on("stopTyping", (receiverId: string) => {
    const ids = getReceiverSocketId(receiverId);
    if (ids.length) io.to(ids).emit("userStopTyping", userId);
  });

  socket.on("joinWorkspace", (workspaceId: string) => {
    socket.join(workspaceId);
    console.log(`User ${userId} joined workspace room: ${workspaceId}`);
  });

  socket.on("leaveWorkspace", (workspaceId: string) => {
    socket.leave(workspaceId);
    console.log(`User ${userId} left workspace room: ${workspaceId}`);
  });

  socket.on("channelTyping", (data: { workspaceId: string; channelId: string }) => {
    const { workspaceId, channelId } = data;
    socket.to(workspaceId).emit("userChannelTyping", { userId, channelId });
  });

  socket.on("channelStopTyping", (data: { workspaceId: string; channelId: string }) => {
    const { workspaceId, channelId } = data;
    socket.to(workspaceId).emit("userChannelStopTyping", { userId, channelId });
  });

  socket.on("messageRead", (data: { senderId: string; receiverId: string }) => {
    const { senderId, receiverId } = data;
    const ids = getReceiverSocketId(senderId);
    if (ids.length) io.to(ids).emit("messagesReadReceipt", receiverId);
  });

  socket.on("statusUpdated", (data: { status: string; statusMessage: string }) => {
    if (userId) {
      userStatusMap[userId] = data.status;
      io.emit("userStatusChanged", {
        userId,
        status: data.status,
        statusMessage: data.statusMessage,
      });
    }
  });

  socket.on("userActive", (activeUserId: string) => {
    io.emit("userActivityOnline", activeUserId);
  });

  socket.on("userInactive", (inactiveUserId: string) => {
    io.emit("userActivityOffline", inactiveUserId);
  });

  // ---- 1:1 call signaling relay (WebRTC offer/answer/ICE + lifecycle) ----
  // Payloads always carry `from` = verified/fallback userId of the sender.
  const relayCall = (event: string, to: string, payload: Record<string, any> = {}) => {
    if (!userId || !to) return;
    const ids = getReceiverSocketId(String(to));
    if (ids.length) io.to(ids).emit(event, { ...payload, from: userId });
  };

  socket.on("call:invite", (data: { to: string; callType: string; offer: any; fromName?: string }) => {
    relayCall("call:incoming", data.to, { callType: data.callType, offer: data.offer, fromName: data.fromName });
  });
  socket.on("call:answer", (data: { to: string; answer: any }) => {
    relayCall("call:answered", data.to, { answer: data.answer });
  });
  socket.on("call:ice", (data: { to: string; candidate: any }) => {
    relayCall("call:ice", data.to, { candidate: data.candidate });
  });
  socket.on("call:decline", (data: { to: string }) => {
    relayCall("call:declined", data.to);
  });
  socket.on("call:hangup", (data: { to: string }) => {
    relayCall("call:ended", data.to);
  });
  socket.on("call:ringing", (data: { to: string }) => {
    relayCall("call:ringing", data.to);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
        delete userStatusMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        io.emit("userOffline", userId);
      }
    }
  });
});

export { io, app, server };
