const MessageSkeleton = () => {
  // Create an array of 6 items for skeleton messages
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 transition-colors duration-200">
      {skeletonMessages.map((_, idx) => (
        <div key={idx} className={`flex gap-3 items-start w-full ${idx % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
          {/* Avatar Skeleton */}
          <div className="size-10 rounded-full bg-base-200 animate-pulse flex-shrink-0" />

          {/* Message content block skeleton */}
          <div className={`flex flex-col max-w-[60%] ${idx % 2 === 0 ? "items-start" : "items-end"}`}>
            <div className="h-3.5 w-16 bg-base-200 animate-pulse rounded-md mb-2" />
            <div className={`h-11 w-[200px] sm:w-[240px] bg-base-200 animate-pulse rounded-2xl ${idx % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
