import { useEffect, useState } from "react";

/**
 * Custom title bar for the installed desktop app (window-controls-overlay).
 * Renders only when running installed with WCO support; the OS draws
 * nothing, so this draggable region replaces it. Hidden in the browser.
 */
export default function TitleBar() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setEnabled(mq.matches && "windowControlsOverlay" in navigator);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!enabled) return null;

  return (
    <div id="blink-titlebar" aria-hidden="true">
      <img src="/blink.svg" alt="" draggable={false} />
      <span>Blink</span>
    </div>
  );
}
