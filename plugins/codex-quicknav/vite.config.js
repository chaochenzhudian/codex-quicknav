import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(ROOT, "ui"),
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: path.join(ROOT, "dist"),
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: { "mcp-app": path.join(ROOT, "ui", "index.html") },
    },
  },
});
