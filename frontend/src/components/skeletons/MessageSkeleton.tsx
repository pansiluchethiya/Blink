/**
 * YouTube-style loading placeholders for the message list.
 * Shimmer rows mimic real chat bubbles (avatar + name + body) so the
 * layout doesn't jump when messages arrive. Shown only when there is
 * no cached content to paint — otherwise cached messages render first
 * with a slim refresh bar on top (see ChatContainer).
 */
const ROWS: { side: "left" | "right"; lines: string[] }[] = [
  { side: "left", lines: ["w-24", "w-56 sm:w-72"] },
  { side: "right", lines: ["w-40 sm:w-60"] },
  { side: "left", lines: ["w-20", "w-32 sm:w-48", "w-44 sm:w-64"] },
  { side: "right", lines: ["w-28", "w-52 sm:w-80"] },
  { side: "left", lines: ["w-36 sm:w-52"] },
  { side: "right", lines: ["w-24", "w-48 sm:w-72"] },
  { side: "left", lines: ["w-28", "w-40 sm:w-56"] },
  { side: "right", lines: ["w-44 sm:w-64"] },
];

const MessageSkeleton = ({ rows = ROWS }: { rows?: typeof ROWS }) => {
  return (
    <div
      className="flex-1 overflow-hidden p-4 sm:p-6 space-y-5"
      aria-hidden="true"
      aria-label="Loading messages"
    >
      {rows.map((row, idx) => {
        const incoming = row.side === "left";
        return (
          <div
            key={idx}
            className={`flex gap-3 items-start w-full max-w-[800px] mx-auto ${
              incoming ? "flex-row" : "flex-row-reverse"
            }`}
          >
            {/* Avatar placeholder (incoming only, like real rows) */}
            {incoming ? (
              <div className="skeleton size-9 rounded-full flex-shrink-0" />
            ) : (
              <div className="size-9 flex-shrink-0" />
            )}

            {/* Bubble placeholder */}
            <div
              className={`flex flex-col gap-2 ${
                incoming ? "items-start" : "items-end"
              }`}
            >
              {incoming && <div className="skeleton h-2.5 w-16 rounded-md" />}
              <div className="flex flex-col gap-1.5">
                {row.lines.map((w, li) => (
                  <div
                    key={li}
                    className={`skeleton h-4 ${w} rounded-2xl ${
                      incoming ? "rounded-tl-md" : "rounded-tr-md"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;
