import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import { rateLimit } from 'express-rate-limit';

import { connectDB } from "./lib/db.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.route.js";
import friendshipRoutes from "./routes/friendship.route.js";
import workspaceRoutes from "./routes/workspace.route.js";
import widgetRoutes from "./routes/widget.route.js";
import { app, server } from "./lib/socket.js";
import { deleteExpiredMessages } from "./controllers/message.controller.js";
import { deleteOldNotifications } from "./controllers/notification.controller.js";
import AppError from "./utils/AppError.js";
import globalErrorHandler from "./middleware/error.middleware.js";
import requestLogger from "./middleware/logger.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5001;
app.set("trust proxy", 1);

// Rate limiting — relaxed for friends-scale Eco (0.1 vCPU), still abuse-safe
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after an hour' }
});

app.use(requestLogger);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
const frontendUrl = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5001",
      "https://blink.koyeb.app",
      ...(frontendUrl ? [frontendUrl] : []),
    ],
    credentials: true,
  })
);

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", app: "Blink by IOP", time: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/messages", generalLimiter, messageRoutes);
app.use("/api/notifications", generalLimiter, notificationRoutes);
app.use("/api/friends", generalLimiter, friendshipRoutes);
app.use("/api/workspaces", generalLimiter, workspaceRoutes);
app.use("/api/widgets", generalLimiter, widgetRoutes);

app.all("/api/*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public")));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  });
}

app.use(globalErrorHandler);

async function seedHelpCenter() {
  try {
    const email = process.env.HELP_CENTER_EMAIL || "help@iop.example.com";
    const helpCenterPassword = process.env.HELP_CENTER_PASSWORD || "change_me";
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(helpCenterPassword, salt);
      await prisma.user.create({
        data: {
          email,
          fullName: "Help Center",
          password: hashedPassword,
          profilePic: "",
          username: "help_center",
          handle: "@help_center",
        },
      });
      console.log("Help Center user seeded successfully.");
    } else if (existingUser.fullName !== "Help Center") {
      await prisma.user.update({ where: { id: existingUser.id }, data: { fullName: "Help Center" } });
      console.log("Help Center user name corrected to 'Help Center'.");
    }
  } catch (error: any) {
    console.error("Error seeding Help Center user:", error.message);
  }
}

server.listen(PORT, async () => {
  console.log(`Blink by IOP server running on PORT: ${PORT}`);
  await connectDB();
  await seedHelpCenter();
  try { await deleteExpiredMessages(); } catch (e: any) { console.error("cleanup expired failed:", e?.message); }
  try { await deleteOldNotifications(); } catch (e: any) { console.error("cleanup notifications failed:", e?.message); }
  setInterval(async () => { try { await deleteExpiredMessages(); } catch {} }, 20 * 60 * 1000);
  setInterval(async () => { try { await deleteOldNotifications(); } catch {} }, 60 * 60 * 1000);
});
