import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Avatar from "./Avatar";
import { useStoryStore, type StoryFeedItem } from "../store/useStoryStore";
import { useAuthStore } from "../store/useAuthStore";
import StoryViewer from "./StoryViewer";

const StoriesStrip = () => {
  const { feed, myStories, fetchFeed, fetchMyStories } = useStoryStore();
  const { authUser } = useAuthStore();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showMine, setShowMine] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeed();
    fetchMyStories();
  }, [fetchFeed, fetchMyStories]);

  // "You" tile + every feed owner become viewer pages in order
  const pages: { mine: boolean; item?: StoryFeedItem }[] = [
    { mine: true },
    ...feed.map((item) => ({ mine: false as const, item })),
  ];

  const openMine = () => {
    if (myStories.length > 0) {
      setShowMine(true);
      setViewerIndex(0);
    } else {
      fileRef.current?.click();
    }
  };

  return (
    <>
      <div className="md:hidden flex gap-3 overflow-x-auto scrollbar-none px-5 pt-4 pb-2">
        {/* You tile */}
        <button onClick={openMine} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
          <div className="relative">
            <div className={`rounded-full p-[2.5px] ${myStories.length > 0 ? "bg-primary" : "bg-base-300"}`}>
              <Avatar user={authUser} className="size-14 border-2 border-base-100" />
            </div>
            <span className="absolute bottom-0 right-0 size-5 rounded-full bg-primary text-primary-content flex items-center justify-center border-2 border-base-100">
              <Plus size={12} strokeWidth={3} />
            </span>
          </div>
          <span className="text-[11px] font-medium text-base-content/70">You</span>
        </button>

        {feed.map((item, i) => (
          <button
            key={item.owner._id}
            onClick={() => { setShowMine(false); setViewerIndex(i + 1); }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
          >
            <div className="relative">
              <div className={`rounded-full p-[2.5px] ${item.hasUnseen ? "bg-gradient-to-tr from-primary via-primary to-amber-400" : "bg-base-300"}`}>
                <Avatar user={{ ...item.owner, _id: item.owner._id }} className="size-14 border-2 border-base-100" />
              </div>
              {item.hasUnseen && item.stories.length > 1 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-base-100">
                  {item.stories.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-base-content/70 truncate w-full text-center">
              {item.owner.fullName.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) useStoryStore.getState().uploadStory(f);
          e.target.value = "";
        }}
      />

      {viewerIndex !== null && (
        <StoryViewer
          pages={showMine ? [{ mine: true }] : pages.filter((p) => !p.mine)}
          startIndex={showMine ? 0 : Math.max(0, viewerIndex - 1)}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
};

export default StoriesStrip;
