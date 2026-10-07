import { Response, NextFunction } from "express";
import { prisma, toResponse, toList, isValidId } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import multer from "multer";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { shapeWorkspaceMessage } from "./workspace-pin.js";

export { togglePinWorkspaceMessage } from "./workspace-pin.js";
export { getThreadMessages, replyInThread } from "./workspace-thread.js";

const meId = (req: AuthRequest): string =>
  String((req as any).user?._id ?? (req as any).user?.id);

const storage = multer.memoryStorage();
export const workspaceUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("file");

const senderMiniSelect = {
  id: true,
  fullName: true,
  email: true,
  profilePic: true,
  status: true,
} as const;

const creatorMiniSelect = {
  id: true,
  fullName: true,
  email: true,
  profilePic: true,
} as const;

const isWorkspaceMember = (
  ws: { members: string[]; ownerId: string },
  userId: string
): boolean => (ws.members ?? []).includes(userId) || ws.ownerId === userId;

async function populateWorkspace(ws: any) {
  const channels =
    ws.channels ??
    (await prisma.channel.findMany({
      where: { workspaceId: ws.id },
      orderBy: { createdAt: "asc" },
    }));
  const memberIds: string[] = ws.members ?? [];
  const memberUsers =
    memberIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: senderMiniSelect,
        })
      : [];
  const byId = new Map(memberUsers.map((u) => [u.id, u]));
  const membersOrdered = memberIds
    .map((id) => byId.get(id))
    .filter((u): u is (typeof memberUsers)[number] => Boolean(u))
    .map((u) => toResponse(u as any));

  const base: any = toResponse(ws as any);
  return {
    ...base,
    owner: ws.ownerId,
    ownerId: ws.ownerId,
    members: membersOrdered,
    channels: toList(channels as any[]),
  };
}

const shapePoll = (p: any) => {
  if (!p) return p;
  const { id, options, creator, ...rest } = p;
  return {
    ...rest,
    _id: id,
    id,
    options: (options ?? []).map((o: any) => ({
      _id: o.id,
      id: o.id,
      pollId: o.pollId,
      text: o.text,
      votes: (o.votes ?? []).map((v: any) => String(v.userId)),
    })),
    creatorId: creator ? toResponse(creator as any) : (p as any).creatorId,
  };
};

const shapeResource = (r: any) => {
  if (!r) return r;
  const { id, uploader, ...rest } = r;
  return {
    ...rest,
    _id: id,
    id,
    uploadedBy: uploader ? toResponse(uploader as any) : (r as any).uploadedBy,
  };
};

const VALID_CHANNEL_TYPES = ["chat", "polls", "resources", "voice"] as const;

export const getWorkspaces = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = meId(req);
  let rows = await prisma.workspace.findMany({
    where: { members: { has: userId } },
    include: { channels: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) {
    console.log("Seeding default workspaces for user: ", userId);

    const seedWorkspaces: Array<{
      name: string;
      icon: string;
      description: string;
      channels: Array<{ name: string; type: string; topic: string }>;
    }> = [
      {
        name: "Design Squad",
        icon: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        description: "Collaboration space for UX/UI designers and React frontend developers.",
        channels: [
          { name: "announcements", type: "chat", topic: "Company-wide styling announcements and React design tokens." },
          { name: "design-critique", type: "chat", topic: "Post and critique UI component mockups." },
          { name: "active-polls", type: "polls", topic: "Vote on layout updates and color harmonies." },
          { name: "resources", type: "resources", topic: "Shared asset links, icons, and typography guides." },
        ],
      },
      {
        name: "AI Lab",
        icon: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        description: "R&D server for advanced agent capabilities, socket bridges, and LLMs.",
        channels: [
          { name: "announcements", type: "chat", topic: "Important announcements about agentic code pipelines." },
          { name: "ai-general", type: "chat", topic: "General discussions about agent logic, vector databases, and UI." },
        ],
      },
      {
        name: "Operations",
        icon: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
        description: "Operational checklists, deployment schedules, and performance monitoring.",
        channels: [
          { name: "ops-announcements", type: "chat", topic: "System status alerts and scaling notifications." },
          { name: "general", type: "chat", topic: "General ops coordination and container scaling conversations." },
        ],
      },
    ];

    for (const w of seedWorkspaces) {
      const created = await prisma.workspace.create({
        data: {
          name: w.name,
          icon: w.icon,
          description: w.description,
          ownerId: userId,
          admins: [userId],
          members: [userId],
          channels: {
            create: w.channels.map((c) => ({
              name: c.name,
              type: c.type as any,
              topic: c.topic,
            })),
          },
        },
        include: { channels: true },
      });

      const announcementsChannel = created.channels.find((c) => c.name.includes("announcements"));
      const generalChannel = created.channels.find(
        (c) => c.name === "general" || c.name === "design-critique" || c.name === "ai-general"
      );
      const pollsChannel = created.channels.find((c) => (c.type as string) === "polls");
      const resourcesChannel = created.channels.find((c) => (c.type as string) === "resources");

      if (announcementsChannel) {
        await prisma.workspaceMessage.create({
          data: {
            senderId: userId,
            workspaceId: created.id,
            channelId: announcementsChannel.id,
            text: `🚀 Welcome to the brand new **${created.name}** workspace! Dive into channels, trigger interactive polls, and share assets directly with your team.`,
          },
        });
      }

      if (generalChannel) {
        await prisma.workspaceMessage.create({
          data: {
            senderId: userId,
            workspaceId: created.id,
            channelId: generalChannel.id,
            text: "Hello everyone! This channel is fully operational. Try sending a message or attaching a file to test the real MERN synchronization.",
          },
        });
      }

      if (pollsChannel) {
        const poll = await prisma.workspacePoll.create({
          data: {
            workspaceId: created.id,
            channelId: pollsChannel.id,
            question: "Which primary palette should we adopt for the new dark mode theme?",
            creatorId: userId,
            options: {
              create: [
                { text: "Neon Glassmorphism (Vibrant Purples & Pinks)" },
                { text: "Midnight Cyberpunk (Deep Blues & Cyans)" },
                { text: "Nordic Minimalist (Sleek Monochromes)" },
              ],
            },
          },
          include: { options: true },
        });
        const firstOption = poll.options[0];
        if (firstOption) {
          await prisma.pollVote.create({
            data: { optionId: firstOption.id, userId },
          });
        }
      }

      if (resourcesChannel) {
        await prisma.workspaceResource.create({
          data: {
            workspaceId: created.id,
            channelId: resourcesChannel.id,
            name: "React Design System Spec.pdf",
            url: "https://res.cloudinary.com/demo/image/upload/v1371281596/sample.jpg",
            type: "application/pdf",
            size: 2048576,
            uploadedBy: userId,
          },
        });
      }
    }

    rows = await prisma.workspace.findMany({
      where: { members: { has: userId } },
      include: { channels: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  const out = [];
  for (const ws of rows) out.push(await populateWorkspace(ws));
  res.status(200).json(out);
});

export const createWorkspace = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, icon, description, handle } = req.body ?? {};
    const userId = meId(req);

    if (!name) return next(new AppError("Workspace name is required", 400));

    if (handle) {
      const existingHandle = await prisma.workspace.findUnique({
        where: { handle: String(handle) },
      });
      if (existingHandle) return next(new AppError("Group handle is already taken", 400));
    }

    const created = await prisma.workspace.create({
      data: {
        name: String(name),
        handle: handle ? String(handle) : null,
        icon: icon || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        description: description || "",
        ownerId: userId,
        admins: [userId],
        members: [userId],
        channels: {
          create: [
            { name: "announcements", type: "chat" as any, topic: "Official announcements." },
            { name: "general", type: "chat" as any, topic: "General chit-chat." },
            { name: "active-polls", type: "polls" as any, topic: "Interactive polls and votes." },
            { name: "resources", type: "resources" as any, topic: "Uploaded files and shared links." },
          ],
        },
      },
      include: { channels: true },
    });

    const annChan = created.channels.find((c) => c.name === "announcements");
    if (annChan) {
      await prisma.workspaceMessage.create({
        data: {
          senderId: userId,
          workspaceId: created.id,
          channelId: annChan.id,
          text: `🎉 Group **${name}** has been successfully created. Welcome your team members!`,
        },
      });
    }

    const populated = await populateWorkspace(created);

    io.emit("newWorkspaceCreated", populated);

    res.status(201).json(populated);
  }
);

export const deleteWorkspace = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const userId = meId(req);

    if (!isValidId(workspaceId as string)) return next(new AppError("Group not found", 404));

    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspace) return next(new AppError("Group not found", 404));

    if (workspace.ownerId !== userId) {
      return next(new AppError("Only the owner can delete the group", 403));
    }

    await prisma.workspaceMessage.deleteMany({ where: { workspaceId: String(workspaceId) } });
    await prisma.workspacePoll.deleteMany({ where: { workspaceId: String(workspaceId) } });
    await prisma.workspaceResource.deleteMany({ where: { workspaceId: String(workspaceId) } });
    await prisma.workspace.delete({ where: { id: String(workspaceId) } });

    io.emit("workspaceDeleted", { workspaceId });

    res.status(200).json({ message: "Group deleted successfully" });
  }
);

export const promoteToAdmin = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId, userId } = req.params;
    const requesterId = meId(req);

    if (!isValidId(workspaceId as string)) return next(new AppError("Group not found", 404));

    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspace) return next(new AppError("Group not found", 404));

    if (workspace.ownerId !== requesterId) {
      return next(new AppError("Only the owner can promote admins", 403));
    }

    if ((workspace.admins ?? []).includes(String(userId))) {
      return next(new AppError("User is already an admin", 400));
    }

    const updated = await prisma.workspace.update({
      where: { id: String(workspaceId) },
      data: { admins: [...(workspace.admins ?? []), String(userId)] },
      include: { channels: { orderBy: { createdAt: "asc" } } },
    });
    const populated = await populateWorkspace(updated);
    io.to(String(workspaceId)).emit("adminPromoted", { workspaceId, userId, workspace: populated });

    res.status(200).json(populated);
  }
);

export const demoteFromAdmin = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId, userId } = req.params;
    const requesterId = meId(req);

    if (!isValidId(workspaceId as string)) return next(new AppError("Group not found", 404));

    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspace) return next(new AppError("Group not found", 404));

    if (workspace.ownerId !== requesterId) {
      return next(new AppError("Only the owner can demote admins", 403));
    }

    const updated = await prisma.workspace.update({
      where: { id: String(workspaceId) },
      data: { admins: (workspace.admins ?? []).filter((id) => id !== String(userId)) },
      include: { channels: { orderBy: { createdAt: "asc" } } },
    });
    const populated = await populateWorkspace(updated);
    io.to(String(workspaceId)).emit("adminDemoted", { workspaceId, userId, workspace: populated });

    res.status(200).json(populated);
  }
);

export const createChannel = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const { name, type, topic } = req.body ?? {};
    const requesterId = meId(req);

    if (!name) return next(new AppError("Channel name is required", 400));
    if (!type) return next(new AppError("Channel type is required", 400));
    if (!(VALID_CHANNEL_TYPES as readonly string[]).includes(String(type))) {
      return next(new AppError("Invalid channel type", 400));
    }
    if (!isValidId(workspaceId as string)) return next(new AppError("Workspace not found", 404));

    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspace) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(workspace as any, requesterId)) {
      return next(new AppError("You are not a member of this workspace", 403));
    }

    const formattedName = String(name).trim().toLowerCase().replace(/\s+/g, "-");

    const newChannel = await prisma.channel.create({
      data: {
        workspaceId: String(workspaceId),
        name: formattedName,
        type: String(type) as any,
        topic: topic || "",
      },
    });

    const refreshed = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
      include: { channels: { orderBy: { createdAt: "asc" } } },
    });
    if (!refreshed) return next(new AppError("Workspace not found after update", 500));
    const populated = await populateWorkspace(refreshed);

    io.to(String(workspaceId)).emit("channelCreated", {
      workspaceId,
      channel: toResponse(newChannel as any),
      workspace: populated,
    });

    res.status(201).json({ workspace: populated, channel: toResponse(newChannel as any) });
  }
);

export const joinWorkspace = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const userId = meId(req);

    if (!isValidId(workspaceId as string)) return next(new AppError("Workspace not found", 404));

    const workspace = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspace) return next(new AppError("Workspace not found", 404));

    if ((workspace.members ?? []).includes(userId)) {
      return next(new AppError("You are already a member of this workspace", 400));
    }

    const updated = await prisma.workspace.update({
      where: { id: String(workspaceId) },
      data: { members: [...(workspace.members ?? []), userId] },
      include: { channels: { orderBy: { createdAt: "asc" } } },
    });

    const populated = await populateWorkspace(updated);

    io.to(String(workspaceId)).emit("userJoinedWorkspace", {
      workspaceId,
      user: (req as any).user,
      workspace: populated,
    });

    res.status(200).json(populated);
  }
);

export const getChannelMessages = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;
  const requesterId = meId(req);
  const { limit: limitRaw, before } = req.query as { limit?: string; before?: string };

  const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
  if (!ws) return res.status(404).json({ error: "Workspace not found" });
  if (!isWorkspaceMember(ws as any, requesterId)) {
    return res.status(403).json({ error: "You are not a member of this workspace" });
  }

  const channel = await prisma.channel.findUnique({ where: { id: String(channelId) } });
  if (!channel || channel.workspaceId !== String(workspaceId)) {
    return res.status(404).json({ error: "Channel not found" });
  }

  const take = Math.min(Math.max(parseInt(String(limitRaw ?? "50"), 10) || 50, 1), 100);

  let beforeDate: Date | undefined;
  if (before) {
    if (isValidId(String(before))) {
      const cursorMsg = await prisma.workspaceMessage.findUnique({
        where: { id: String(before) },
      });
      if (cursorMsg) beforeDate = cursorMsg.createdAt;
    } else {
      const parsed = new Date(String(before));
      if (!Number.isNaN(parsed.getTime())) beforeDate = parsed;
    }
  }

  const messages = await prisma.workspaceMessage.findMany({
    where: {
      workspaceId: String(workspaceId),
      channelId: String(channelId),
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    include: { sender: { select: senderMiniSelect }, replyTo: true },
    orderBy: { createdAt: "desc" },
    take,
  });

  res.status(200).json(messages.map(shapeWorkspaceMessage).reverse());
});

export const sendChannelMessage = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId, channelId } = req.params;
    const { text, image, replyTo } = req.body ?? {};
    const senderId = meId(req);

    if (text && String(text).length > 1024) {
      return next(new AppError("Message must be 1024 characters or less", 400));
    }

    const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
    if (!ws) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(ws as any, senderId)) {
      return res.status(403).json({ error: "You are not a member of this workspace" });
    }

    const channel = await prisma.channel.findUnique({ where: { id: String(channelId) } });
    if (!channel || channel.workspaceId !== String(workspaceId)) {
      return next(new AppError("Channel not found", 404));
    }

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let fileData: any = null;
    const uploadedFile = (req as any).file;
    if (uploadedFile) {
      const uploadResponse = await cloudinary.uploader.upload(
        `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString("base64")}`,
        {
          resource_type: "auto",
          public_id: `workspace_file_${Date.now()}_${uploadedFile.originalname}`,
        }
      );
      fileData = {
        url: uploadResponse.secure_url,
        name: uploadedFile.originalname,
        type: uploadedFile.mimetype,
        size: uploadedFile.size,
      };
    }

    let replyToId: string | null = null;
    if (replyTo) {
      if (!isValidId(String(replyTo))) return next(new AppError("Reply target not found", 404));
      const target = await prisma.workspaceMessage.findUnique({
        where: { id: String(replyTo) },
      });
      if (!target) return next(new AppError("Reply target not found", 404));
      replyToId = target.id;
    }

    const created = await prisma.workspaceMessage.create({
      data: {
        senderId,
        workspaceId: String(workspaceId),
        channelId: String(channelId),
        text: text ? String(text) : "",
        image: imageUrl,
        file: fileData ?? undefined,
        replyToId,
      },
    });
    const populated = await prisma.workspaceMessage.findUnique({
      where: { id: created.id },
      include: { sender: { select: senderMiniSelect }, replyTo: true },
    });

    const shaped = shapeWorkspaceMessage(populated);

    io.to(String(workspaceId)).emit("newWorkspaceMessage", shaped);

    res.status(201).json(shaped);
  }
);

export const addMessageReaction = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { messageId } = req.params;
    const { emoji } = req.body ?? {};
    const userId = meId(req);

    if (!isValidId(messageId as string)) return next(new AppError("Message not found", 404));
    if (!emoji) return next(new AppError("Emoji is required", 400));

    const message = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
    });
    if (!message) return next(new AppError("Message not found", 404));

    const reactions: Record<string, string[]> = ((message.reactions as any) ?? {}) as Record<
      string,
      string[]
    >;
    const userList: string[] = Array.isArray(reactions[String(emoji)])
      ? [...reactions[String(emoji)]]
      : [];
    if (!userList.includes(userId)) {
      userList.push(userId);
      reactions[String(emoji)] = userList;
      await prisma.workspaceMessage.update({
        where: { id: String(messageId) },
        data: { reactions: reactions as any },
      });
    }

    const updated = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
      include: { sender: { select: senderMiniSelect }, replyTo: true },
    });
    const shaped = shapeWorkspaceMessage(updated);

    io.to(message.workspaceId.toString()).emit("workspaceReactionAdded", {
      messageId,
      reactions: (shaped as any)?.reactions ?? {},
      workspaceId: message.workspaceId,
      channelId: message.channelId,
    });

    res.status(200).json(shaped);
  }
);

export const removeMessageReaction = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { messageId } = req.params;
    const { emoji } = req.body ?? {};
    const userId = meId(req);

    if (!isValidId(messageId as string)) return next(new AppError("Message not found", 404));
    if (!emoji) return next(new AppError("Emoji is required", 400));

    const message = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
    });
    if (!message) return next(new AppError("Message not found", 404));

    const reactions: Record<string, string[]> = ((message.reactions as any) ?? {}) as Record<
      string,
      string[]
    >;
    const userList: string[] = Array.isArray(reactions[String(emoji)])
      ? [...reactions[String(emoji)]]
      : [];
    const index = userList.indexOf(userId);
    if (index > -1) {
      userList.splice(index, 1);
      if (userList.length === 0) {
        delete reactions[String(emoji)];
      } else {
        reactions[String(emoji)] = userList;
      }
      await prisma.workspaceMessage.update({
        where: { id: String(messageId) },
        data: { reactions: reactions as any },
      });
    }

    const updated = await prisma.workspaceMessage.findUnique({
      where: { id: String(messageId) },
      include: { sender: { select: senderMiniSelect }, replyTo: true },
    });
    const shaped = shapeWorkspaceMessage(updated);

    io.to(message.workspaceId.toString()).emit("workspaceReactionRemoved", {
      messageId,
      reactions: (shaped as any)?.reactions ?? {},
      workspaceId: message.workspaceId,
      channelId: message.channelId,
    });

    res.status(200).json(shaped);
  }
);

export const getPolls = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;
  const requesterId = meId(req);

  const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
  if (!ws) return res.status(404).json({ error: "Workspace not found" });
  if (!isWorkspaceMember(ws as any, requesterId)) {
    return res.status(403).json({ error: "You are not a member of this workspace" });
  }

  const polls = await prisma.workspacePoll.findMany({
    where: { workspaceId: String(workspaceId), channelId: String(channelId) },
    include: {
      creator: { select: creatorMiniSelect },
      options: { include: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(polls.map(shapePoll));
});

export const createPoll = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId, channelId } = req.params;
    const { question, options } = req.body ?? {};
    const creatorId = meId(req);

    if (!question) return next(new AppError("Question is required", 400));
    if (!options || !Array.isArray(options) || options.length < 2) {
      return next(new AppError("At least two options are required", 400));
    }

    const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
    if (!ws) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(ws as any, creatorId)) {
      return res.status(403).json({ error: "You are not a member of this workspace" });
    }
    const channel = await prisma.channel.findUnique({ where: { id: String(channelId) } });
    if (!channel || channel.workspaceId !== String(workspaceId)) {
      return next(new AppError("Channel not found", 404));
    }

    const labels = (options as any[])
      .map((opt: any) => (typeof opt === "string" ? opt : String(opt?.text ?? opt ?? "")).trim())
      .filter((t) => t.length > 0);
    if (labels.length < 2) return next(new AppError("At least two options are required", 400));

    const created = await prisma.workspacePoll.create({
      data: {
        workspaceId: String(workspaceId),
        channelId: String(channelId),
        question: String(question),
        creatorId,
        options: { create: labels.map((text) => ({ text })) },
      },
    });
    const populated = await prisma.workspacePoll.findUnique({
      where: { id: created.id },
      include: {
        creator: { select: creatorMiniSelect },
        options: { include: { votes: true } },
      },
    });

    const shaped = shapePoll(populated);

    io.to(String(workspaceId)).emit("pollCreated", shaped);

    res.status(201).json(shaped);
  }
);

export const voteInPoll = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { pollId } = req.params;
    const { optionId } = req.body ?? {};
    const userId = meId(req);

    if (!isValidId(pollId as string)) return next(new AppError("Poll not found", 404));
    if (!optionId || !isValidId(String(optionId))) return next(new AppError("Option not found", 404));

    const poll = await prisma.workspacePoll.findUnique({
      where: { id: String(pollId) },
      include: { options: { select: { id: true } } },
    });
    if (!poll) return next(new AppError("Poll not found", 404));

    const optionIds = poll.options.map((o) => o.id);
    if (!optionIds.includes(String(optionId))) {
      return next(new AppError("Option not found", 404));
    }

    const ws = await prisma.workspace.findUnique({ where: { id: poll.workspaceId } });
    if (!ws) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(ws as any, userId)) {
      return res.status(403).json({ error: "You are not a member of this workspace" });
    }

    const existingVotes = await prisma.pollVote.findMany({
      where: { userId, optionId: { in: optionIds } },
    });
    const votedTarget = existingVotes.find((v) => v.optionId === String(optionId));

    if (votedTarget) {
      // Toggle off
      await prisma.pollVote.delete({ where: { id: votedTarget.id } });
    } else {
      // Single-choice: clear other votes in this poll, then vote (create + catch unique violation)
      if (existingVotes.length > 0) {
        await prisma.pollVote.deleteMany({
          where: { userId, optionId: { in: optionIds } },
        });
      }
      try {
        await prisma.pollVote.create({
          data: { optionId: String(optionId), userId },
        });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
        // Concurrent vote won the race; treat as voted
      }
    }

    const populated = await prisma.workspacePoll.findUnique({
      where: { id: String(pollId) },
      include: {
        creator: { select: creatorMiniSelect },
        options: { include: { votes: true } },
      },
    });

    const shaped = shapePoll(populated);

    io.to(poll.workspaceId.toString()).emit("pollVoted", shaped);

    res.status(200).json(shaped);
  }
);

export const getResources = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;
  const requesterId = meId(req);

  const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
  if (!ws) return res.status(404).json({ error: "Workspace not found" });
  if (!isWorkspaceMember(ws as any, requesterId)) {
    return res.status(403).json({ error: "You are not a member of this workspace" });
  }

  const resources = await prisma.workspaceResource.findMany({
    where: { workspaceId: String(workspaceId), channelId: String(channelId) },
    include: { uploader: { select: creatorMiniSelect } },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(resources.map(shapeResource));
});

export const uploadResource = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId, channelId } = req.params;
    const userId = meId(req);

    const uploadedFile = (req as any).file;
    if (!uploadedFile) return next(new AppError("No file uploaded", 400));

    const ws = await prisma.workspace.findUnique({ where: { id: String(workspaceId) } });
    if (!ws) return next(new AppError("Workspace not found", 404));
    if (!isWorkspaceMember(ws as any, userId)) {
      return res.status(403).json({ error: "You are not a member of this workspace" });
    }
    const channel = await prisma.channel.findUnique({ where: { id: String(channelId) } });
    if (!channel || channel.workspaceId !== String(workspaceId)) {
      return next(new AppError("Channel not found", 404));
    }

    const uploadResponse = await cloudinary.uploader.upload(
      `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString("base64")}`,
      {
        resource_type: "auto",
        public_id: `res_${Date.now()}_${uploadedFile.originalname}`,
      }
    );

    const created = await prisma.workspaceResource.create({
      data: {
        workspaceId: String(workspaceId),
        channelId: String(channelId),
        name: uploadedFile.originalname,
        url: uploadResponse.secure_url,
        type: uploadedFile.mimetype,
        size: uploadedFile.size,
        uploadedBy: userId,
      },
    });
    const populated = await prisma.workspaceResource.findUnique({
      where: { id: created.id },
      include: { uploader: { select: creatorMiniSelect } },
    });

    const shaped = shapeResource(populated);

    io.to(String(workspaceId)).emit("resourceUploaded", shaped);

    res.status(201).json(shaped);
  }
);
