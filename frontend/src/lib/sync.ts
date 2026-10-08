import { db } from './db';
import { axiosInstance } from './axios';

/**
 * Offline outbox. Failed/offline sends are queued in IndexedDB and
 * flushed (oldest-first) when connectivity returns. Only text/image-URL
 * sends are queued — binary uploads can't survive a reload, so those
 * keep the previous fail-loud behavior.
 *
 * The store is reached via dynamic import to avoid a static
 * store <-> sync import cycle.
 */
export const SyncService = {
  async queueAction(type: 'sendMessage' | 'addReaction' | 'deleteMessage', payload: any) {
    await db.pendingActions.add({
      type,
      payload,
      timestamp: Date.now()
    });
    // Opportunistic flush if we're actually online.
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void this.processPendingActions();
    }
  },

  async pendingCount(): Promise<number> {
    try {
      return await db.pendingActions.count();
    } catch {
      return 0;
    }
  },

  async processPendingActions() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    let actions;
    try {
      actions = await db.pendingActions.orderBy('timestamp').toArray();
    } catch {
      return;
    }
    if (actions.length === 0) return;

    for (const action of actions) {
      try {
        if (action.type === 'sendMessage') {
          const { receiverId, tempId, ...body } = action.payload ?? {};
          if (!receiverId) throw new Error('missing receiverId');
          // JSON body: backend accepts plain fields when no file is attached
          // (multer only handles multipart; express.json covers the rest).
          const res = await axiosInstance.post(`/messages/send/${receiverId}`, body);
          const { useChatStore } = await import('../store/useChatStore.js');
          useChatStore.getState().mergeServerMessage(tempId, res.data, receiverId);
        }
        await db.pendingActions.delete(action.id!);
      } catch (error) {
        // Still offline or server rejected it — stop and retry on the
        // next `online` event / app boot so one poison item can't
        // block or spin the queue.
        break;
      }
    }
  },
};
