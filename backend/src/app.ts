// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: building and configuring the Fastify application instance — route registration, plugins, and middleware wiring. Replaces the router assembly previously sketched in backend/cmd/server/main.go's setupRouter() (Go skeleton, removed).
import Fastify, { FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env";

// buildApp constructs a Fastify instance with every module's routes registered, but does not start listening.
export function buildApp(config: AppConfig): FastifyInstance {
  const app = Fastify({ logger: true });

  // TODO: register @fastify/cors, @fastify/helmet, and @fastify/sensible (or equivalents) as baseline plugins
  // TODO: register auth.routes (signup/login/logout) — no auth required
  // TODO: register permissions.middleware as a preHandler hook on protected route groups (requireAuth / requireRole)
  // TODO: register projects.routes, kanban.routes, notes.routes, attachments.routes, search.routes, notifications.routes — behind requireAuth
  // TODO: register git.webhook route — no JWT auth, but HMAC signature verification instead (see modules/git/webhook.routes.ts)
  // TODO: register publicapi.routes behind API-key auth + rate-limit middleware, distinct from the JWT-based routes above
  // TODO: register a Socket.IO server against app.server (the underlying Node http.Server) in server.ts, not here —
  //       Fastify owns the HTTP routes, Socket.IO owns the /socket.io/ upgrade path

  return app;
}
