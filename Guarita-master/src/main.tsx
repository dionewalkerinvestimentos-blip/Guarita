import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import "./index.css";
import "./responsive.css";
import "./hide-vercel-toolbar.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="guarita-theme">
    <App />
  </ThemeProvider>
);
