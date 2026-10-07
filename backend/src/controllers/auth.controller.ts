import { Response, NextFunction } from "express";
import { generateToken } from "../lib/utils.js";
import { prisma, toResponse } from "../lib/prisma.js";
import NotificationService from "../services/notification.service.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const getUserId = (req: AuthRequest): string => {
  const u: any = (req as any).user;
  return String(u?._id ?? u?.id);
};

export const signup = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(new AppError("Email already exists", 400));

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  let baseUsername = emailPrefix || fullName.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
  if (baseUsername.length > 20) baseUsername = baseUsername.slice(0, 20);

  let username = baseUsername;
  let handle = `@${baseUsername}`;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const u = await prisma.user.findUnique({ where: { username } }).catch(() => null);
    const h = await prisma.user.findUnique({ where: { handle } }).catch(() => null);
    if (!u && !h) break;
    const suffix = counter.toString();
    username = `${baseUsername.slice(0, 29 - suffix.length)}${suffix}`;
    handle = `@${baseUsername.slice(0, 19 - suffix.length)}${suffix}`;
    counter++;
    if (counter > 100) return next(new AppError("Could not generate unique username", 500));
  }

  const newUser = await prisma.user.create({
    data: { fullName, email, password: hashedPassword, username, handle },
  });

  const token = generateToken(newUser.id, res);
  NotificationService.sendWelcomeNotification(newUser.id).catch(() => {});

  res.status(201).json({
    _id: newUser.id,
    fullName: newUser.fullName,
    email: newUser.email,
    profilePic: newUser.profilePic,
    notificationPreferences: newUser.notificationPreferences,
    token,
  });
});


export const login = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) return next(new AppError("Invalid credentials", 400));

  const isPasswordCorrect = await bcrypt.compare(password || "", user.password);
  if (!isPasswordCorrect) return next(new AppError("Invalid credentials", 400));

  await prisma.user.update({ where: { id: user.id }, data: { status: "online", lastSeen: new Date() } });
  const token = generateToken(user.id, res);

  res.status(200).json({
    _id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    notificationPreferences: user.notificationPreferences,
    token,
  });
});


export const logout = (req: AuthRequest, res: Response) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getUserByUsername = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username } = req.params;
  const requesterId = getUserId(req);
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return next(new AppError("User not found", 404));
  const { password: _pw, email: _em, ...safe } = user as any;
  const out: any = toResponse(safe as any);
  if (!user.allowedViewers?.includes(requesterId)) {
    delete out.privateAvatar;
    delete out.isPrivate;
  }
  res.status(200).json(out);
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const allowed = ["username", "handle", "bio", "avatar", "profilePic", "isPrivate", "privateAvatar", "statusMessage", "theme"] as const;
  const updates = req.body ?? {};
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }
  // Back-compat: publicProfile {bio,avatar}, privateProfile {isPrivate,avatar}
  if (updates.publicProfile) {
    if (updates.publicProfile.bio !== undefined) updateData.bio = updates.publicProfile.bio;
    if (updates.publicProfile.avatar !== undefined) updateData.avatar = updates.publicProfile.avatar;
  }
  if (updates.privateProfile) {
    if (updates.privateProfile.isPrivate !== undefined) updateData.isPrivate = updates.privateProfile.isPrivate;
    if (updates.privateProfile.avatar !== undefined) updateData.privateAvatar = updates.privateProfile.avatar;
  }

  if (updateData.profilePic && typeof updateData.profilePic === "string" && (updateData.profilePic as string).startsWith("data:")) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(updateData.profilePic as string);
      updateData.profilePic = uploadResponse.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return next(new AppError("Failed to upload image", 500));
    }
  }

  const me = getUserId(req);
  if (updateData.username) {
    const existing = await prisma.user.findUnique({ where: { username: updateData.username as string } });
    if (existing && existing.id !== me) return next(new AppError("Username already taken", 400));
  }
  if (updateData.handle) {
    const existing = await prisma.user.findUnique({ where: { handle: updateData.handle as string } });
    if (existing && existing.id !== me) return next(new AppError("Handle already taken", 400));
  }

  const updated = await prisma.user.update({ where: { id: me }, data: updateData });
  const { password: _pw2, ...safe2 } = updated as any;
  res.status(200).json(toResponse(safe2 as any));
});

export const checkAuth = (req: AuthRequest, res: Response) => {
  res.status(200).json(req.user);
};

