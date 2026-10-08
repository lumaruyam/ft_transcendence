import { defineConfig, type Plugin } from "vite";
import { existsSync } from "fs";
import { dirname, relative, resolve, sep } from "path";
import react from "@vitejs/plugin-react";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// where `vite dev` proxies /api and /socket.io; override with BACKEND_URL when the backend isn't on port 3000
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

// `vite dev` serves each page under its folder (/kanban/index.html), but the app lives on the clean URLs
// nginx maps in infra/nginx/default.conf.template (/app/:id, /app, ...), and the pages read the project id
// from that URL. This applies the same mapping in dev; keep both in sync.
const PAGE_ROUTES: [RegExp, string][] = [
  [/^\/$/, "/landing/index.html"],
  [/^\/app\/?$/, "/dashboard/index.html"],
  [/^\/app\/[^/]+\/settings\/?$/, "/project-settings/index.html"],
  [/^\/app\/[^/]+\/whiteboard\/?$/, "/whiteboard/index.html"],
  [/^\/app\/[^/]+\/notes\/?$/, "/notes/index.html"],
  [/^\/app\/[^/]+\/?$/, "/kanban/index.html"],
  // no dot: /invite/main.ts is the page script, not a token
  [/^\/invite\/[^/.]+$/, "/invite/index.html"],
  [/^\/auth\/callback$/, "/auth-callback/index.html"],
];

function nginxLikePageRoutes(root: string): Plugin {
  return {
    name: "nginx-like-page-routes",
    // On /app/:id the browser would resolve each page's <script src="./main.ts"> to /app/main.ts: in dev, make
    // the relative src/href absolute from the Vite root. The production build already emits absolute asset paths.
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return;
      const dir = relative(root, dirname(ctx.filename)).split(sep).join("/");
      return html.replace(/\b(src|href)="\.\/([^"]+)"/g, `$1="/${dir}/$2"`);
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [path, query] = (req.url ?? "").split("?");
        const mapped =
          PAGE_ROUTES.find(([pattern]) => pattern.test(path))?.[1] ??
          // /login, /signup, /legal/privacy, ... : the folder's own index.html, as nginx's try_files does
          (/^\/[\w/-]+$/.test(path) && existsSync(resolve(root, "." + path, "index.html")) ? `${path.replace(/\/$/, "")}/index.html` : null);
        if (mapped) req.url = query ? `${mapped}?${query}` : mapped;
        next();
      });
    },
  };
}

// @ts-ignore — import.meta.dirname requires lib: ["ES2023"] or higher but works at runtime with Vite 8
const srcRoot = resolve(import.meta.dirname, "src");

export default defineConfig({
  // React plugin is needed only for src/whiteboard/ (Excalidraw) — activates only on .tsx files.
  // Svelte plugin is the frontend main framework — activates only on .svelte files.
  // the Vite root is src/, so the Svelte config at the frontend root has to be pointed at explicitly
  plugins: [react(), svelte({ configFile: resolve(srcRoot, "../svelte.config.js") }), nginxLikePageRoutes(srcRoot)],
  resolve: {
		alias: {
			"@excalidraw/excalidraw": resolve(
				import.meta.dirname,
				"node_modules/@excalidraw/excalidraw/dist/excalidraw.production.min.js",
			),
		},
	},
  root: resolve(import.meta.dirname, "src"),
  publicDir: resolve(import.meta.dirname, "public"),
  server: {
    port: 5173,
    host: true,
    // Same routing as nginx in the docker stack: the backend owns /api and /socket.io.
    // Lets `vite dev` talk to a backend started on the host (npm run dev in backend/, port 3000).
    proxy: {
      "/api": {
        target: backendUrl,
        // src/api/*.ts is frontend source served by Vite under the same /api prefix: don't proxy those
        bypass: (req) => (/\.(ts|tsx|js|svelte|css)(\?|$)/.test(req.url ?? "") ? req.url : undefined),
      },
      "/socket.io": { target: backendUrl, ws: true },
    },
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
