/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/08/29 14:54:07 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/08/29 23:23:15 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: building and configuring the Fastify application instance — route registration, plugins, and middleware wiring.
import Fastify, { FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env";

// Import plugins
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

// Import route handlers
import { registerAuthRoutes } from "./modules/auth/auth.routes";
import { registerProjectRoutes } from "./modules/projects/projects.routes" // need new file
import { registerInviteRoutes } from "./modules/projects/invites";
import { registerKanbanRoutes } from "./modules/kanban/kanban.routes" // need to create new file
import { registerNotesRoutes } from "./modules/notes/notes.routes" // need new file
import { registerAttachmentsRoutes } from "./modules/attachments/attachments.routes" // need new file
import { registerSearchRoutes } from "./modules/search/search.routes" // need new file
import { registerNotificationsRoutes } from "./modules/notifications/notifications.routes"
import { registerGitWebhookRoutes } from "./modules/git/webhook.routes.js";
import { registerPublicApiRoutes } from "./modules/publicapi/publicapi.routes.js";

// Register plugins
function registerPlugins(app: FastifyInstance, config: AppConfig): void {
	// Security plugins
	app.register(helmet); // Security headers
	app.register(cors, {origin: true,}); // Allow all Cross-Origin Resource Sharing

	app.register(rateLimit, {
		max: config.rateLimit.globalMax,
		timeWindow: config.rateLimit.globalWindowMs
	});
}

// Register all routes
function registerRoutes(app: FastifyInstance): void {
	app.register(registerAuthRoutes, { prefix: "/api/auth" }); // Public routes
	app.register(registerGitWebhookRoutes, { prefix: "/api"}); // Webhook route

}

// buildApp constructs a Fastify instance with every module's routes registered, but does not start listening.
export function buildApp(config: AppConfig): FastifyInstance {
  const app = Fastify({ logger: true });

  registerPlugins(app, config);
  registerAuthRoutes(app);

  // TODO: register @fastify/cors, @fastify/helmet, and @fastify/sensible (or equivalents) as baseline plugins
  // TODO: register @fastify/rate-limit globally — the chosen, standardized rate-limiting strategy
  //       for the whole app (see docs/architecture.md "Rate limiting strategy" for the full
  //       writeup). Register it BEFORE routes, with config.rateLimit.globalMax /
  //       config.rateLimit.globalWindowMs as the site-wide default (e.g. `app.register(rateLimit,
  //       { max: config.rateLimit.globalMax, timeWindow: config.rateLimit.globalWindowMs })`).
  //       Individual routes override this default via their own route-level `config: { rateLimit:
  //       {...} }` — see modules/projects/invites.ts's INVITE_JOIN_RATE_LIMIT for the invite join
  //       endpoint's dedicated, stricter override.
  //       Multi-instance note: @fastify/rate-limit's default store is in-memory per process, so
  //       running more than one backend instance behind Nginx gives each instance its own
  //       independent counter (effectively multiplying the real limit by instance count). Fine
  //       for this project's single-instance docker-compose deployment; if the team ever scales
  //       to multiple backend instances, swap in a shared store (the plugin's `redis` option,
  //       e.g. via ioredis) so all instances share one counter — not needed now, noted for later.
  // TODO: register auth.routes (signup/login/logout) — no auth required
  // TODO: register permissions.middleware as a preHandler hook on protected route groups (requireAuth / requireRole)
  // TODO: register projects.routes, invites (modules/projects/invites.ts's registerInviteRoutes),
  //       kanban.routes, notes.routes, attachments.routes, search.routes, notifications.routes —
  //       behind requireAuth. Note: within invites, only the create/revoke routes also require
  //       requireRole("admin") — the join route requires login but deliberately NOT project
  //       membership, since granting that membership is the point of the route.
  // TODO: register git.webhook route — no JWT auth, but HMAC signature verification instead (see modules/git/webhook.routes.ts)
  // TODO: register publicapi.routes behind API-key auth + rate-limit middleware, distinct from the JWT-based routes above
  // TODO: register a Socket.IO server against app.server (the underlying Node http.Server) in server.ts, not here —
  //       Fastify owns the HTTP routes, Socket.IO owns the /socket.io/ upgrade path

  return app;
}


