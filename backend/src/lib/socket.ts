import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

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

const userSocketMap: Record<string, string> = {}; // {userId: socketId}
const userStatusMap: Record<string, string> = {}; // {userId: status}

export function getReceiverSocketId(userId: string): string | undefined {
  return userSocketMap[userId];
}

io.on("connection", (socket: Socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;
  if (userId) {
    userSocketMap[userId] = socket.id;
    userStatusMap[userId] = "online";
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", (receiverId: string) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", userId);
    }
  });

  socket.on("stopTyping", (receiverId: string) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", userId);
    }
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
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesReadReceipt", receiverId);
    }
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

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      delete userStatusMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      io.emit("userOffline", userId);
    }
  });
});

export { io, app, server };
