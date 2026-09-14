// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handler(s) for cross-entity search within a project.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import { searchAll } from "./search.service.js";

export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", { preHandler: requireAuth }, searchHandler);
}

// searchHandler runs a combined cards/notes/attachments search for a project.
async function searchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read query params { projectId, q } → call searchAll(projectId, q)
}
