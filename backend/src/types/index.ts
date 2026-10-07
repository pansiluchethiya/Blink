export type ObjectId = string;

export interface IUser {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  profilePic?: string;
  pushSubscription?: any;
  chatSettings?: Map<string, any>;
  status?: 'online' | 'offline' | 'away' | 'busy';
  dnd?: boolean;
  statusMessage?: string;
  lastSeen?: Date;
  blockedUsers?: (string | string)[];
  pinnedChats?: (string | string)[];
  archivedChats?: (string | string)[];
  mutedChats?: (string | string)[];
  lockedChats?: (string | string)[];
  lockPins?: Map<string, string>;
  theme?: string;
  notificationPreferences?: {
    directMessages: boolean;
    mentions: boolean;
    workspaceActivity: boolean;
  };
  // New fields for profile handling
  username: string;
  handle: string;
  publicProfile?: {
    bio?: string;
    avatar?: string;
  };
  privateProfile?: {
    isPrivate?: boolean;
    avatar?: string;
  };
  allowedViewers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string | string;
  senderId: string | string | IUser;
  receiverId: string | string | IUser;
  text?: string | null;
  image?: string | null;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  } | null;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  replyTo?: string | string | IMessage | null;
  forwardedFrom?: string | string | IMessage | null;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: { text: string; editedAt: Date }[];
  isDeleted: boolean;
  deletedAt?: Date;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: string | string;
  threadId?: string | string | null;
  threadReplyCount?: number;
  isExpired?: boolean;
  expiresAt?: Date;
  viewOnce: boolean;
  viewedOnce: boolean;
  viewedAt?: Date;
  reactions?: Map<string, (string | string)[]> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspace {
  _id: string | string;
  name: string;
  handle?: string;
  icon?: string;
  description?: string;
  owner: string | string;
  admins: (string | string)[];
  members: (string | string | IUser)[];
  channels: IChannel[];
  maxMembers: number;
  pendingApproval: boolean;
  joinRequests: (string | string)[];
  permissions: {
    canEditInfo: 'admins' | 'everyone';
    canSendMessages: 'admins' | 'everyone';
    canAddMembers: 'admins' | 'everyone';
  };
  disappearingMessages: {
    enabled: boolean;
    duration: number;
  };
  communityId?: string | string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannel {
  _id: string | string;
  name: string;
  type: 'chat' | 'polls' | 'resources';
  topic?: string;
  isPrivate?: boolean;
}

export interface IFriendship {
  _id: string | string;
  requesterId: string | string | IUser;
  receiverId: string | string | IUser;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string | string;
  recipient: string | string | IUser;
  actor: string | string | IUser;
  type: 'direct_message' | 'group_message' | 'mention' | 'reply' | 'friend_request' | 'friend_accept' | 'follow' | 'reaction' | 'welcome' | 'announcement' | 'security';
  title: string;
  body: string;
  metadata?: {
    messageId?: string | string;
    conversationId?: string | string;
    groupId?: string | string;
    reactionType?: string;
    link?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup {
  _id: string | string;
  name: string;
  members: (string | string | IUser)[];
  admin: string | string | IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceMessage {
  _id: string | string;
  senderId: string | string | IUser;
  workspaceId: string | string | IWorkspace;
  channelId: string | string;
  text?: string;
  image?: string;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  reactions?: Map<string, (string | string)[]>;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string | string | IWorkspaceMessage;
  threadId?: string | string | null;
  threadReplyCount?: number;
  // Pinning fields
  isPinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: string | string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspacePoll {
  _id: string | string;
  workspaceId: string | string | IWorkspace;
  channelId: string | string;
  question: string;
  options: {
    text: string;
    votes: (string | string)[];
    _id?: string | string;
  }[];
  creatorId: string | string | IUser;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceResource {
  _id: string | string;
  workspaceId: string | string | IWorkspace;
  channelId: string | string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string | string | IUser;
  createdAt: Date;
  updatedAt: Date;
}
