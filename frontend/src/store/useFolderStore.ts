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

const DEFAULT_FOLDERS: ChatFolder[] = [
  { id: "folder-important", name: "Important", color: "#F59E0B", memberIds: [] },
  { id: "folder-work", name: "Work", color: "#0EA5E9", memberIds: [] },
  { id: "folder-freelancers", name: "Freelancers", color: "#8B5CF6", memberIds: [] },
  { id: "folder-team", name: "Team", color: "#10B981", memberIds: [] },
];

function loadFolders(): ChatFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FOLDERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_FOLDERS;
    return parsed.filter(
      (f: any) => f && typeof f.id === "string" && typeof f.name === "string" && Array.isArray(f.memberIds)
    );
  } catch {
    return DEFAULT_FOLDERS;
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

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: loadFolders(),
  expanded: { "folder-freelancers": true },
  hydrated: false,

  fetchFolders: async () => {
    if (get().hydrated) return;
    try {
      const res = await axiosInstance.get("/folders");
      let folders = clean(res.data);
      if (folders && folders.length === 0) {
        // First run for this account: seed the server with the local set
        // (defaults or previously-offline edits) so all devices converge.
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
