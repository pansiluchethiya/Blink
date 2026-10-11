import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export interface Story {
  id: string;
  ownerId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string | null;
  archived: boolean;
  expiresAt: string;
  createdAt: string;
  viewedBy: string[];
  owner?: { _id: string; fullName: string; profilePic?: string };
}

export interface StoryFeedItem {
  owner: { _id: string; fullName: string; profilePic?: string };
  stories: Story[];
  hasUnseen: boolean;
}

interface StoryState {
  feed: StoryFeedItem[];
  myStories: Story[];
  archivedStories: Story[];
  isLoading: boolean;
  fetchFeed: () => Promise<void>;
  fetchMyStories: () => Promise<void>;
  fetchArchived: () => Promise<void>;
  uploadStory: (file: File, caption?: string) => Promise<boolean>;
  viewStory: (storyId: string) => Promise<void>;
  archiveStory: (storyId: string) => Promise<void>;
  unarchiveStory: (storyId: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  feed: [],
  myStories: [],
  archivedStories: [],
  isLoading: false,

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/stories/feed");
      const flat: Story[] = res.data ?? [];
      // Group flat story rows by owner (self lives in myStories, not the strip)
      let selfId = "";
      try {
        selfId = String(useAuthStore.getState().authUser?._id ?? "");
      } catch { /* store may not be loaded */ }
      const groups = new Map<string, StoryFeedItem>();
      for (const st of flat) {
        if (selfId && String(st.ownerId) === selfId) continue;
        const key = String(st.ownerId);
        if (!groups.has(key)) {
          groups.set(key, {
            owner: {
              _id: st.owner?._id ?? key,
              fullName: st.owner?.fullName ?? "Unknown",
              profilePic: st.owner?.profilePic,
            },
            stories: [],
            hasUnseen: false,
          });
        }
        const g = groups.get(key)!;
        g.stories.push(st);
        if (!st.viewedBy.map(String).includes(selfId)) g.hasUnseen = true;
      }
      set({ feed: Array.from(groups.values()) });
    } catch {
      /* feed is non-critical */
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyStories: async () => {
    try {
      const res = await axiosInstance.get("/stories/me");
      set({ myStories: res.data ?? [] });
    } catch {
      /* ignore */
    }
  },

  fetchArchived: async () => {
    try {
      const res = await axiosInstance.get("/stories/me/archived");
      set({ archivedStories: res.data ?? [] });
    } catch {
      /* ignore */
    }
  },

  uploadStory: async (file: File, caption?: string) => {
    const form = new FormData();
    form.append("media", file);
    if (caption) form.append("caption", caption);
    try {
      await axiosInstance.post("/stories", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await Promise.all([get().fetchFeed(), get().fetchMyStories()]);
      toast.success("Story posted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to post story");
      return false;
    }
  },

  viewStory: async (storyId: string) => {
    try {
      await axiosInstance.post(`/stories/${storyId}/view`);
      await get().fetchFeed();
    } catch {
      /* ignore */
    }
  },

  archiveStory: async (storyId: string) => {
    try {
      await axiosInstance.patch(`/stories/${storyId}/archive`);
      await Promise.all([get().fetchFeed(), get().fetchMyStories(), get().fetchArchived()]);
      toast.success("Story archived");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to archive story");
    }
  },

  unarchiveStory: async (storyId: string) => {
    try {
      await axiosInstance.patch(`/stories/${storyId}/unarchive`);
      await Promise.all([get().fetchFeed(), get().fetchMyStories(), get().fetchArchived()]);
      toast.success("Story restored for 24h");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to restore story");
    }
  },

  deleteStory: async (storyId: string) => {
    try {
      await axiosInstance.delete(`/stories/${storyId}`);
      await Promise.all([get().fetchFeed(), get().fetchMyStories(), get().fetchArchived()]);
      toast.success("Story deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete story");
    }
  },
}));
