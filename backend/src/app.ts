/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   app.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/08/29 14:54:07 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/08/31 20:55:58 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: building and configuring the Fastify application instance — route registration, plugins, and middleware wiring.
import Fastify, { FastifyInstance } from "fastify";
import type { AppConfig } from "./config/env.js";

// Import plugins
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

// Import route handlers
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerProjectsRoutes } from "./modules/projects/projects.routes.js"; // need new file
import { registerInviteRoutes } from "./modules/projects/invites.js";
import { registerKanbanRoutes } from "./modules/kanban/kanban.routes.js"; // need to create new file
import { registerNotesRoutes } from "./modules/notes/notes.routes.js"; // need new file
import { registerAttachmentsRoutes } from "./modules/attachments/attachments.routes.js" // need new file
import { registerSearchRoutes } from "./modules/search/search.routes.js"; // need new file
import { registerNotificationsRoutes } from "./modules/notifications/notifications.routes.js";
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
	app.register(registerAuthRoutes, { prefix: "/api/auth" }); // Public routes (no auth required)
	app.register(registerGitWebhookRoutes, { prefix: "/api"}); // Webhook routes (HMAC-signed, no JWT)

	// Protected routes (require JWT)
	// Each of these route modules applies requireAuth / requireRole itself as a preHandler
	app.register(registerProjectsRoutes, { prefix: "/api/projects" });
	app.register(registerInviteRoutes, { prefix: "/api/projects" });
	app.register(registerKanbanRoutes, { prefix: "/api" });
	app.register(registerNotesRoutes, { prefix: "/api/notes" });
	app.register(registerAttachmentsRoutes, { prefix: "/api/attachments" });
	app.register(registerSearchRoutes, { prefix: "/api/search" });
	app.register(registerNotificationsRoutes, { prefix: "/api/notifications" });

	app.register(registerPublicApiRoutes, { prefix: "/api" }); // Public API routes (API-key auth, not JWT)
}

// buildApp constructs a Fastify instance with every module's routes registered, but does not start listening.
export function buildApp(config: AppConfig): FastifyInstance {
  const app = Fastify({ logger: true, });

  registerPlugins(app, config);
  registerRoutes(app);

  return app;
}


