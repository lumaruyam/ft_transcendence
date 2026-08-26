// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the 5+ documented REST endpoints (GET/POST/PUT/DELETE) required by the Public API major module, wrapping Track 2/3/4's underlying entities. TS equivalent of backend/internal/publicapi/endpoints.go (Go skeleton, removed).
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// registerPublicApiRoutes mounts the documented /api/* public endpoints, called from app.ts behind API-key auth + rate limiting.
export function registerPublicApiRoutes(app: FastifyInstance): void {
  app.get("/api/projects/:projectId/cards", getCardsHandler);
  app.post("/api/projects/:projectId/cards", createCardHandler);
  app.put("/api/projects/:projectId/cards/:cardId", updateCardHandler);
  app.delete("/api/projects/:projectId/cards/:cardId", deleteCardHandler);
  app.get("/api/projects", getProjectsHandler);
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

// getProjectsHandler lists the caller's projects — GET /api/projects, the 5th documented endpoint.
async function getProjectsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: delegate to projects' listProjectsForUser
}
