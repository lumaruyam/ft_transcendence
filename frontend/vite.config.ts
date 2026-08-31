import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
// @ts-ignore — import.meta.dirname requires lib: ["ES2023"] or higher but works at runtime with Vite 8

export default defineConfig({
  // React plugin is needed only for src/whiteboard/ (Excalidraw).
  // All other pages are vanilla TS — the plugin only activates on .tsx files.
  plugins: [react()],
  root: resolve(import.meta.dirname, "src"),
  publicDir: resolve(import.meta.dirname, "public"),
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        landing:            resolve(import.meta.dirname, "src/landing/index.html"),
        login:              resolve(import.meta.dirname, "src/login/index.html"),
        signup:             resolve(import.meta.dirname, "src/signup/index.html"),
        "forgot-password":  resolve(import.meta.dirname, "src/forgot-password/index.html"),
        "auth-callback":    resolve(import.meta.dirname, "src/auth-callback/index.html"),
        invite:             resolve(import.meta.dirname, "src/invite/index.html"),
        settings:           resolve(import.meta.dirname, "src/settings/index.html"),
        dashboard:          resolve(import.meta.dirname, "src/dashboard/index.html"),
        kanban:             resolve(import.meta.dirname, "src/kanban/index.html"),
        "project-settings": resolve(import.meta.dirname, "src/project-settings/index.html"),
        whiteboard:         resolve(import.meta.dirname, "src/whiteboard/index.html"),
        notes:              resolve(import.meta.dirname, "src/notes/index.html"),
        "not-found":        resolve(import.meta.dirname, "src/not-found/index.html"),
        error:              resolve(import.meta.dirname, "src/error/index.html"),
        "legal-privacy":    resolve(import.meta.dirname, "src/legal/privacy/index.html"),
        "legal-terms":      resolve(import.meta.dirname, "src/legal/terms/index.html"),
      },
    },
  },
});
