import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

/**
 * Chat folders (the CATEGORIES section of the chat list).
 *
 * API-backed (Phase 6: `Folder` table + /api/folders) with a localStorage
 * fallback so folders keep working offline. Same {id, name, color,
 * memberIds} shape on both layers. Single membership: assigning a chat to
 * one folder removes it from the others, keeping counts unambiguous.
 */

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

interface FolderState {
  folders: ChatFolder[];
  expanded: Record<string, boolean>;
  hydrated: boolean;
  fetchFolders: () => Promise<void>;
  addFolder: (name: string, color: string) => void;
  renameFolder: (id: string, name: string, color: string) => void;
  deleteFolder: (id: string) => void;
  toggleMember: (folderId: string, chatId: string) => void;
  folderOf: (chatId: string) => ChatFolder | undefined;
  toggleExpand: (id: string) => void;
}

const STORAGE_KEY = "blink-folders";

// No pre-made folders: the list starts empty and the user adds their own.
// "All" is the implicit default view (the ALL CHATS section + the All chip).
const DEFAULT_SIGNATURES = new Set([
  "Important|#F59E0B",
  "Work|#0EA5E9",
  "Freelancers|#8B5CF6",
  "Team|#10B981",
]);

// True when this looks like a pre-made folder the user never adopted:
// matches a retired default name+color and has no chats assigned.
const isUnaddedDefault = (f: ChatFolder) =>
  f.memberIds.length === 0 && DEFAULT_SIGNATURES.has(`${f.name}|${f.color}`);

function loadFolders(): ChatFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f: any) => f && typeof f.id === "string" && typeof f.name === "string" && Array.isArray(f.memberIds)
    );
  } catch {
    return [];
  }
}

function persist(folders: ChatFolder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch {
    /* storage full/blocked — keep in-memory */
  }
}

const clean = (folders: unknown): ChatFolder[] | null => {
  if (!Array.isArray(folders)) return null;
  return (folders as any[]).filter(
    (f) => f && typeof f.id === "string" && typeof f.name === "string" && Array.isArray(f.memberIds)
  );
};

export const FOLDER_COLORS = ["#F59E0B", "#0EA5E9", "#8B5CF6", "#10B981", "#EC4899", "#64748B"];

// In-flight guard: two mount-time callers (App auth effect + list mount)
// otherwise both pass the `hydrated` check and seed the server twice.
let fetchInflight: Promise<void> | null = null;

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: loadFolders(),
  expanded: {},
  hydrated: false,

  fetchFolders: async () => {
    if (get().hydrated) return;
    if (fetchInflight) return fetchInflight;
    fetchInflight = (async () => {
      try {
        // Drop retired pre-made folders from the local cache up front so
        // they can never be re-seeded to the server below.
        const localKept = get().folders.filter((f) => !isUnaddedDefault(f));
        if (localKept.length !== get().folders.length) {
          persist(localKept);
          set({ folders: localKept });
        }
        const res = await axiosInstance.get("/folders");
        let folders = clean(res.data);
        if (folders) {
          // One-time cleanup: drop retired pre-made folders the user never
          // adopted (empty + default name/color), locally and on the server.
          const pruned = folders.filter(isUnaddedDefault);
          if (pruned.length > 0) {
            folders = folders.filter((f) => !isUnaddedDefault(f));
            persist(folders);
            for (const f of pruned) {
              if (!f.id.startsWith("folder-")) {
                axiosInstance.delete(`/folders/${f.id}`).catch(() => {});
              }
            }
          }
        }
        if (folders && folders.length === 0 && get().folders.some((f) => !isUnaddedDefault(f))) {
          // First run for this account: seed the server with the local set
          // (previously-offline user folders) so all devices converge.
          for (const f of get().folders) {
            try {
              await axiosInstance.post("/folders", { name: f.name, color: f.color, memberIds: f.memberIds });
            } catch {
              /* keep going — partial seeds reconcile on next login */
            }
          }
          const retry = await axiosInstance.get("/folders").catch(() => null);
          folders = clean(retry?.data) ?? folders;
        }
        if (folders) {
          persist(folders);
          set({ folders, hydrated: true });
          return;
        }
      } catch {
        /* offline — keep the local cache */
      }
      set({ hydrated: true });
    })();
    try {
      await fetchInflight;
    } finally {
      fetchInflight = null;
    }
  },

  addFolder: (name, color) => {
    const folder: ChatFolder = {
      id: `folder-${Date.now().toString(36)}`,
      name: name.trim().slice(0, 24) || "New folder",
      color,
      memberIds: [],
    };
    const folders = [...get().folders, folder];
    persist(folders);
    set({ folders, expanded: { ...get().expanded, [folder.id]: true } });
    // Reconcile the temp id with the server id when online.
    axiosInstance
      .post("/folders", { name: folder.name, color: folder.color })
      .then((res) => {
        const server = clean([res.data])?.[0];
        if (!server) return;
        const next = get().folders.map((f) =>
          f.id === folder.id ? server : f
        );
        persist(next);
        set((s) => {
          const expanded = { ...s.expanded };
          if (expanded[folder.id] !== undefined) {
            expanded[server.id] = expanded[folder.id];
            delete expanded[folder.id];
          }
          return { folders: next, expanded };
        });
      })
      .catch(() => {});
  },

  renameFolder: (id, name, color) => {
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, name: name.trim().slice(0, 24) || f.name, color } : f
    );
    persist(folders);
    set({ folders });
    axiosInstance.patch(`/folders/${id}`, { name, color }).catch(() => {});
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((f) => f.id !== id);
    persist(folders);
    const expanded = { ...get().expanded };
    delete expanded[id];
    set({ folders, expanded });
    axiosInstance.delete(`/folders/${id}`).catch(() => {});
  },

  toggleMember: (folderId, chatId) => {
    const folders = get().folders.map((f) => {
      if (f.id === folderId) {
        const has = f.memberIds.includes(chatId);
        return { ...f, memberIds: has ? f.memberIds.filter((m) => m !== chatId) : [...f.memberIds, chatId] };
      }
      // Single membership — assigning elsewhere removes it here.
      return { ...f, memberIds: f.memberIds.filter((m) => m !== chatId) };
    });
    persist(folders);
    set({ folders });
    axiosInstance.put(`/folders/${folderId}/members`, { chatId }).catch(() => {});
  },

  folderOf: (chatId) => get().folders.find((f) => f.memberIds.includes(chatId)),

  toggleExpand: (id) => set({ expanded: { ...get().expanded, [id]: !get().expanded[id] } }),
}));
