import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISSED_KEY = "blink-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

/** "Install Blink" card: native prompt on Android/desktop, manual hint on iOS. */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
  });
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* noop */ }
    setDismissed(true);
  };

  // iOS Safari: no prompt event — show one-time manual hint
  if (!deferred) {
    if (!isIos()) return null;
    return (
      <div className="fixed bottom-20 inset-x-4 z-50 sm:left-auto sm:right-6 sm:w-80">
        <div className="card bg-base-100 border border-base-300 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Share className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-base-content">Install Blink</p>
              <p className="text-base-content/60 text-xs mt-0.5">Tap Share, then “Add to Home Screen”.</p>
            </div>
            <button onClick={dismiss} className="btn btn-ghost btn-xs btn-circle ml-auto" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 sm:left-auto sm:right-6 sm:w-80">
      <div className="card bg-base-100 border border-base-300 shadow-xl p-4">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="Blink" className="w-10 h-10 rounded-xl" />
          <div className="text-sm">
            <p className="font-bold text-base-content">Install Blink</p>
            <p className="text-base-content/60 text-xs">Faster launches, offline chats.</p>
          </div>
          <button onClick={dismiss} className="btn btn-ghost btn-xs btn-circle ml-auto" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          className="btn btn-primary btn-sm w-full mt-3"
          onClick={async () => {
            deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setDeferred(null);
          }}
        >
          <Download className="w-4 h-4" /> Install
        </button>
      </div>
    </div>
  );
}
