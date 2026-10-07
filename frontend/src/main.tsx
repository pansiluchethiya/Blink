import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter";
import "./index.css";
import App from "./App";

import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then(
      (registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      },
      (error) => {
        console.error("Service Worker registration failed:", error);
      }
    );
  });
}
