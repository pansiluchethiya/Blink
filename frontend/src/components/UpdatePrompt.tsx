import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/** Notifies when a new service-worker version is waiting, with one-tap refresh. */
export default function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker.getRegistration().then((r) => {
      reg = r;
      if (!reg) return;
      if (reg.waiting) {
        setWaiting(reg.waiting);
        return;
      }
      reg.onupdatefound = () => {
        const sw = reg!.installing;
        if (!sw) return;
        sw.onstatechange = () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(sw);
          }
        };
      };
    });
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed top-3 inset-x-4 z-50 sm:left-auto sm:right-6 sm:w-80">
      <div className="card bg-base-100 border border-base-300 shadow-xl p-3 flex flex-row items-center gap-3">
        <RefreshCw className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm font-semibold text-base-content">New version available</p>
        <button
          className="btn btn-primary btn-xs ml-auto"
          onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
