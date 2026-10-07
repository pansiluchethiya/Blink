import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Slim offline banner; hidden while online. */
export default function OfflineBar() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="mt-2 flex items-center gap-2 bg-base-content text-base-100 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
        <WifiOff className="w-3.5 h-3.5" />
        You’re offline — new messages will send when you reconnect
      </div>
    </div>
  );
}
