// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the 5+ documented REST endpoints (GET/POST/PUT/DELETE) required by the Public API major module, wrapping Track 2/3/4's underlying entities. TS equivalent of backend/internal/publicapi/endpoints.go (Go skeleton, removed).

// Every route runs the same preHandler chain:
// requireApiKey          401 — valid X-API-Key, sets request.apiKey + request.userId
// rateLimitMiddleware    429 — per-key quota (api_keys.rate_limit), sets X-RateLimit-* headers
// enforceKeyProjectScope 403 — a project-scoped key can't reach another project
// requireRole            403 — the key's user must hold the role in project_members (docs/architecture.md §5)

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole } from "../permissions/permissions.middleware.js";
import { ROLES } from "../permissions/roles.service.js";
import { createCard, updateCard, deleteCard } from "../kanban/cards.service.js";
import { requireApiKey, enforceKeyProjectScope, API_KEY_ROUTE_CONSTRAINT } from "./apikey.middleware.js";
import { rateLimitMiddleware } from "./ratelimit.middleware.js";
import { registerApiKeyManagementRoutes } from "./apikeys.routes.js";
import { listProjectForKey, listProjectCards, listBelongsToProject, cardBelongsToProject, toPublicCard, } from "./publicapi.service.js";
import { validateCreateCardBody, validateUpdateCardBody, validateListCardsQuery, } from "./publicapi.validation.js";

const authChain = [requireApiKey, rateLimitMiddleware];
const projectChain = (minRole typeof ROLES[keyof typeof ROLES]) => [...authChain, enforceKeyProjectScope, requireRole(minRole), ];

// registerPublicApiRoutes mounts the documented /api/* public endpoints, called from app.ts behind API-key auth + rate limiting
export async function registerPublicApiRoutes(app: FastifyInstance): Promise<void> {
	app.get("/projects", { constraints: API_KEY_ROUTE_CONSTRAINT, preHandler: authChain }, getProjectsHandler);
	app.get("/projects/:projectId/cards", { preHandler: projectChain(ROLES.VIEWER) }, getCardsHandler);
	app.post("/projects/:projectId/cards", { preHandler: projectChain(ROLES.MEMBER) }, createCardHandler);
	app.put("/projects/:projectId/cards/:cardId", {preHandler: projectChain(ROLES.MEMBER) }, updateCardHandler);
	app.delete("/projects/:projectId/cards/:cardId", { preHandler: projectChain(ROLES.MEMBER) }, deleteCardHandler);

	// JWT-authenticated key management (issue/list/revoke)
	await app.register(registerApiKeyManagementRoutes);
}

// getProjectsHandler lists the caller's projects — GET /api/projects
async function getProjectsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const apiKey = request.apiKey!;
	const projects = await listProjectForKey(apiKey.userId as string, apiKey.projectId);
	reply.code(200).send({ projects });
}

// getCardsHandler lists cards for a project — GET /api/projects/{id}/cards.
async function getCardsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: API key + rate limit validated by preHandler chain
  // TODO: delegate to kanban's cards.service listing function, serialize as documented JSON response
}

// createCardHandler creates a card via the public API — POST /api/projects/{id}/cards.
async function createCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: validate request body against the documented schema
  // TODO: delegate to kanban's createCard; broadcasting still happens via Track 2 Person B's Socket.IO hub
}

// updateCardHandler updates a card via the public API — PUT /api/projects/{id}/cards/{cardId}.
async function updateCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: validate request body, delegate to kanban's updateCard
}

// deleteCardHandler deletes a card via the public API — DELETE /api/projects/{id}/cards/{cardId}.
async function deleteCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: delegate to kanban's deleteCard
}


