import { create } from "zustand";

/**
 * Chat folders (the CATEGORIES section of the chat list).
 *
 * Local-first for v3 Phase 2: persisted to localStorage in an API-shaped
 * model (id / name / color / memberIds) so the Phase-6 backend (`Folder`
 * table + CRUD endpoints) can swap the persistence layer without touching
 * the UI. Single membership: assigning a chat to one folder removes it
 * from the others, keeping counts unambiguous.
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

export const FOLDER_COLORS = ["#F59E0B", "#0EA5E9", "#8B5CF6", "#10B981", "#EC4899", "#64748B"];

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: loadFolders(),
  expanded: { "folder-freelancers": true },

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
  },

  renameFolder: (id, name, color) => {
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, name: name.trim().slice(0, 24) || f.name, color } : f
    );
    persist(folders);
    set({ folders });
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((f) => f.id !== id);
    persist(folders);
    const expanded = { ...get().expanded };
    delete expanded[id];
    set({ folders, expanded });
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
  },

  folderOf: (chatId) => get().folders.find((f) => f.memberIds.includes(chatId)),

  toggleExpand: (id) => set({ expanded: { ...get().expanded, [id]: !get().expanded[id] } }),
}));
