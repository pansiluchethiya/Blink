import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Archive, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import { useStoryStore, type Story, type StoryFeedItem } from "../store/useStoryStore";
import { useAuthStore } from "../store/useAuthStore";

interface Page {
  mine: boolean;
  item?: StoryFeedItem;
}

const StoryViewer = ({ pages, startIndex, onClose }: { pages: Page[]; startIndex: number; onClose: () => void }) => {
  const { myStories, viewStory, archiveStory, deleteStory } = useStoryStore();
  const { authUser } = useAuthStore();
  const [pageIdx, setPageIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);

  const page = pages[pageIdx];
  const stories: Story[] = useMemo(
    () => (page?.mine ? myStories : page?.item?.stories ?? []),
    [page, myStories]
  );
  const story = stories[storyIdx];
  const owner = page?.mine ? authUser : page?.item?.owner;

  useEffect(() => {
    setStoryIdx(0);
  }, [pageIdx]);

  useEffect(() => {
    if (story && !page?.mine && authUser && !story.viewedBy.includes(String(authUser._id))) {
      viewStory(story.id);
    }
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!page || !story) return null;

  const goNext = () => {
    if (storyIdx < stories.length - 1) setStoryIdx(storyIdx + 1);
    else if (pageIdx < pages.length - 1) setPageIdx(pageIdx + 1);
    else onClose();
  };
  const goPrev = () => {
    if (storyIdx > 0) setStoryIdx(storyIdx - 1);
    else if (pageIdx > 0) setPageIdx(pageIdx - 1);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* progress */}
      <div className="flex gap-1 px-3 pt-3">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div className={`h-full bg-white rounded-full ${i < storyIdx ? "w-full" : i === storyIdx ? "w-2/3" : "w-0"}`} />
          </div>
        ))}
      </div>

      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar user={owner} className="size-9 border border-white/20" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {page.mine ? "Your story" : owner?.fullName}
          </p>
          <p className="text-white/60 text-xs">
            {new Date(story.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        {page.mine && !story.archived && (
          <button onClick={() => { archiveStory(story.id); onClose(); }} className="p-2 rounded-full text-white/80 hover:bg-white/10" title="Archive">
            <Archive size={18} />
          </button>
        )}
        {page.mine && (
          <button onClick={() => { deleteStory(story.id); onClose(); }} className="p-2 rounded-full text-white/80 hover:bg-white/10" title="Delete">
            <Trash2 size={18} />
          </button>
        )}
        <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* media */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={goNext}>
        {story.mediaType === "video" ? (
          <video src={story.mediaUrl} controls autoPlay className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()} />
        ) : (
          <img src={story.mediaUrl} alt={story.caption ?? "Story"} className="max-h-full max-w-full object-contain" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {story.caption && (
        <p className="px-5 pb-6 text-white text-sm text-center">{story.caption}</p>
      )}
    </div>
  );
};

export default StoryViewer;
