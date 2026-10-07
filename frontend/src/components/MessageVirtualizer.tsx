import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Loader } from "lucide-react";

const MessageVirtualizer = ({
  items = [],
  renderItem,
  onScrollToTop,
  isMoreAvailable = false,
  isLoadingMore = false,
  overscan = 5,
  defaultHeight = 85,
}) => {
  const containerRef = useRef(null);
  const sizeMap = useRef(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [, forceUpdate] = useState(0);

  // Keep track of scroll offset restoration for prepend anchoring
  const prevItemsLength = useRef(0);
  const prevScrollHeight = useRef(0);
  const prevScrollTop = useRef(0);
  const isPrepending = useRef(false);

  // ResizeObserver to track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });
    observer.observe(container);

    // Initial measurement
    setContainerHeight(container.getBoundingClientRect().height);
    setScrollTop(container.scrollTop);

    return () => observer.disconnect();
  }, []);

  // Detect when items are prepended
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (items.length > prevItemsLength.current) {
      
      // If we added items and the scroll was not near the bottom, it's likely a prepend (lazy load)
      if (prevScrollTop.current < 200 && prevItemsLength.current > 0) {
        isPrepending.current = true;
        
        // Dynamic scroll anchoring: calculate the change in scrollHeight
        const currentScrollHeight = container.scrollHeight;
        const deltaHeight = currentScrollHeight - prevScrollHeight.current;
        
        container.scrollTop = prevScrollTop.current + deltaHeight;
      }
    }

    prevItemsLength.current = items.length;
    prevScrollHeight.current = container.scrollHeight;
    prevScrollTop.current = container.scrollTop;
  }, [items]);

  // Handle scroll events — rAF-throttled to avoid per-pixel re-renders
  const rafId = useRef(0);
  const handleScroll = useCallback((e) => {
    const container = e.currentTarget;
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      const currentScrollTop = container.scrollTop;
      setScrollTop((prev) => (Math.abs(prev - currentScrollTop) > 4 ? currentScrollTop : prev));
      prevScrollTop.current = currentScrollTop;
      prevScrollHeight.current = container.scrollHeight;

      // Check if we hit top sentinel to load more
      if (currentScrollTop < 100 && onScrollToTop && isMoreAvailable && !isLoadingMore) {
        onScrollToTop();
      }
    });
  }, [onScrollToTop, isMoreAvailable, isLoadingMore]);

  useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current); }, []);

  // Height measurement callback for items
  const measureRef = useCallback((id) => (node) => {
    if (node) {
      const height = node.getBoundingClientRect().height;
      if (sizeMap.current.get(id) !== height) {
        sizeMap.current.set(id, height);
        // Force update to recalculate positions with new measured sizes
        forceUpdate(prev => prev + 1);
      }
    }
  }, []);

  // Compute layout positions for all items
  const offsets = [];
  let totalHeight = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item._id || item.id || String(i);
    const height = sizeMap.current.get(id) || defaultHeight;
    offsets.push({
      id,
      top: totalHeight,
      height,
      index: i
    });
    totalHeight += height;
  }

  // Find range of items to render
  let startIndex = 0;
  let endIndex = items.length - 1;

  for (let i = 0; i < offsets.length; i++) {
    const itemOffset = offsets[i];
    if (itemOffset.top + itemOffset.height > scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
  }

  for (let i = startIndex; i < offsets.length; i++) {
    const itemOffset = offsets[i];
    if (itemOffset.top > scrollTop + containerHeight) {
      endIndex = Math.min(items.length - 1, i + overscan);
      break;
    }
  }

  // Render sliced visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (items[i]) {
      visibleItems.push(offsets[i]);
    }
  }

  // Padding spacer heights to keep scrolling smooth
  const paddingTop = visibleItems.length > 0 ? visibleItems[0].top : 0;
  const paddingBottom = visibleItems.length > 0 
    ? totalHeight - (visibleItems[visibleItems.length - 1].top + visibleItems[visibleItems.length - 1].height) 
    : 0;

  // Scroll to bottom on initial load
  useEffect(() => {
    const container = containerRef.current;
    if (container && items.length > 0 && prevItemsLength.current <= 1) {
      container.scrollTop = container.scrollHeight;
    }
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto relative w-full h-full scrollbar-thin select-text"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      style={{ contentVisibility: "auto", contain: "layout style" }}
    >
      {/* Loading Indicator at the top */}
      {isLoadingMore && (
        <div className="flex justify-center py-4 bg-transparent w-full">
          <Loader size={18} className="animate-spin text-primary" />
        </div>
      )}

      {/* Spacers and virtual list */}
      <div 
        style={{ 
          paddingTop: `${paddingTop}px`, 
          paddingBottom: `${paddingBottom}px`,
          position: "relative",
          width: "100%"
        }}
      >
        {visibleItems.map(({ id, index }) => {
          const item = items[index];
          return (
            <div 
              key={id} 
              ref={measureRef(id)}
              className="w-full"
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageVirtualizer;
