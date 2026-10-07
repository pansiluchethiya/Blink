const SidebarSkeleton = () => {
  // Create 6 skeleton items
  const skeletonContacts = Array(6).fill(null);

  return (
    <aside className="h-full w-full lg:w-[300px] border-r border-base-200/80 bg-base-200 flex flex-col transition-all duration-200">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="skeleton h-7 w-28 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton size-8 rounded-full" />
          <div className="skeleton size-8 rounded-full" />
        </div>
      </div>

      {/* Online shelf skeleton */}
      <div className="px-5 mb-6 flex-shrink-0">
        <div className="skeleton h-3 w-16 mb-3 rounded" />
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="skeleton size-11 rounded-full" />
            <div className="skeleton h-2.5 w-8 rounded" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="skeleton size-11 rounded-full" />
            <div className="skeleton h-2.5 w-8 rounded" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="skeleton size-11 rounded-full" />
            <div className="skeleton h-2.5 w-8 rounded" />
          </div>
        </div>
      </div>

      {/* Contact cards skeletons */}
      <div className="overflow-y-auto w-full py-2 space-y-1">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="px-4 py-3 flex items-center gap-3.5 mx-3 rounded-2xl border border-transparent">
            {/* Avatar skeleton */}
            <div className="relative">
              <div className="skeleton size-12 rounded-full" />
            </div>

            {/* Info skeleton */}
            <div className="text-left min-w-0 flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-2.5 w-10 rounded" />
              </div>
              <div className="skeleton h-3 w-40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
