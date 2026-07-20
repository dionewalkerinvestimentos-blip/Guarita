import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import "./index.css";
import "./responsive.css";
import "./hide-vercel-toolbar.css";

// In development, unregister any service workers and clear caches to avoid
// serving stale builds from previous projects during local debugging.
if (import.meta.env.DEV) {
  if (typeof navigator !== "undefined" && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {});
      if (typeof caches !== "undefined") {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
      }
      try { localStorage.clear(); } catch { /* ignore */ }
    } catch (e) {
      // ignore errors in dev cleanup
    }
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="guarita-theme">
    <App />
  </ThemeProvider>
);
