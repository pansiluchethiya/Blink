import Dexie, { Table } from 'dexie';
import { IMessage, IUser } from '../types';

export interface PendingAction {
  id?: number;
  type: 'sendMessage' | 'addReaction' | 'deleteMessage';
  payload: any;
  timestamp: number;
}

/** Message row as stored in IndexedDB — IMessage plus the lookup key. */
export interface CachedMessage extends IMessage {
  conversationKey: string;
}

/** One-slot stash for an inbound OS share (share_target POST / file_handlers). */
export interface ShareStash {
  id: string;
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
  ts: number;
}

/** Local-only quick note (note_taking integration, no backend). */
export interface QuickNote {
  id?: number;
  text: string;
  updatedAt: number;
}

export class ChatDatabase extends Dexie {
  messages!: Table<CachedMessage, string>;
  users!: Table<IUser, string>;
  pendingActions!: Table<PendingAction, number>;
  shareStash!: Table<ShareStash, string>;
  notes!: Table<QuickNote, number>;

  constructor() {
    super('BlinkChatDB');
    // v1: legacy schema (unused by the app — nothing ever read/wrote it).
    this.version(1).stores({
      messages: '++_id, senderId, receiverId, channelId, createdAt',
      users: '_id, username, email',
      pendingActions: '++id, type, timestamp'
    });
    // v2: string primary key + conversationKey for per-chat lookups.
    // (Cache-only table: Dexie recreates it on upgrade, no user data at risk.)
    this.version(2).stores({
      messages: '_id, conversationKey, createdAt',
      users: '_id, username, email',
      pendingActions: '++id, type, timestamp'
    });
    // v3: share stash + local notes. Cache/utility tables — safe to recreate.
    this.version(3).stores({
      messages: '_id, conversationKey, createdAt',
      users: '_id, username, email',
      pendingActions: '++id, type, timestamp',
      shareStash: 'id',
      notes: '++id, updatedAt'
    });
  }
}

export const db = new ChatDatabase();
