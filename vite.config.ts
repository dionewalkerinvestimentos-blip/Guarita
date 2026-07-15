import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;
  const developmentPlugins = [];

  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    developmentPlugins.push(componentTagger());
  }

  return ({
    server: {
      host: "::",
      port: PORT,
      strictPort: true,
      hmr: {
        host: 'localhost',
        port: PORT,
        protocol: 'ws'
      }
    },
    plugins: [react(), ...developmentPlugins],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
});
