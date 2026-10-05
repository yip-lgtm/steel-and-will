import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

/** Static build for https://yip-lgtm.github.io/cute/ — no server functions. */
export default defineConfig({
  base: "/cute/",
  publicDir: "public",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@/lib/dossier.functions",
        replacement: fileURLToPath(new URL("./src/lib/dossier.pages.ts", import.meta.url)),
      },
      { find: "@", replacement: src },
    ],
  },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./pages.html", import.meta.url)),
    },
  },
});
