import { db } from './db';
import { IMessage, IUser } from '../types';

/**
 * IndexedDB message/user cache (stale-while-revalidate).
 * All helpers are best-effort: any failure resolves to a miss/empty,
 * so the network path is the only thing the UI depends on.
 */

export const MAX_CACHED_PER_CONVERSATION = 120;

/** Stable key for a DM pair (order-independent) or a channel. */
export const dmConversationKey = (a: string, b: string): string =>
  [String(a), String(b)].sort().join(':');

export const channelConversationKey = (channelId: string): string =>
  `channel:${channelId}`;

/** Newest `limit` cached messages for a conversation, oldest-first. */
export async function getCachedMessages(
  conversationKey: string,
  limit = 30
): Promise<IMessage[]> {
  try {
    const rows = await db.messages
      .where('conversationKey')
      .equals(conversationKey)
      .sortBy('createdAt');
    return rows.slice(-limit).map((row) => {
      const { conversationKey: _omit, ...msg } = row;
      return msg as IMessage;
    });
  } catch {
    return [];
  }
}

/** Write-through: store messages and evict everything beyond the cap. */
export async function persistMessages(
  conversationKey: string,
  messages: IMessage[]
): Promise<void> {
  if (!messages.length) return;
  try {
    await db.messages.bulkPut(
      messages.map((m) => ({ ...m, conversationKey }))
    );
    const all = await db.messages
      .where('conversationKey')
      .equals(conversationKey)
      .sortBy('createdAt');
    if (all.length > MAX_CACHED_PER_CONVERSATION) {
      const stale = all.slice(0, all.length - MAX_CACHED_PER_CONVERSATION);
      await db.messages.bulkDelete(stale.map((m) => m._id));
    }
  } catch {
    /* storage full/blocked — network remains source of truth */
  }
}

/** Cached sidebar users (whole list, small). */
export async function getCachedUsers(): Promise<IUser[]> {
  try {
    return await db.users.toArray();
  } catch {
    return [];
  }
}

/** Replace the cached sidebar user list. */
export async function persistUsers(users: IUser[]): Promise<void> {
  try {
    await db.users.clear();
    if (users.length) await db.users.bulkPut(users);
  } catch {
    /* ignore */
  }
}
