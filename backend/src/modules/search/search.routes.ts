//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: Fastify route handler(s) for cross-entity search within a project.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import { searchAll } from "./search.service.js";
//max length of search string=query
const MAX_QUERY_LENGTH = 200;

// The "/search" sub-namespace belongs here, not to app.ts — paths stay relative to whatever
// single boundary prefix app.ts registers this module with (currently "/api").
export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/search", { preHandler: requireAuth }, searchHandler);
}

//runs a combined cards/notes/attachments search for a project.
async function searchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const { q } = request.query as { q?: string };//q? means q undefined, q can be null
	const query = q?.trim() ?? "";//trim removes whitespace from both ends of a string
                        //?? means if q is null, use the "" as default
  //if search string is too long, return 400 error
	if (query.length > MAX_QUERY_LENGTH) {
		reply.code(400).send({ error: "invalid_input", details: [`q must be at most ${MAX_QUERY_LENGTH} characters`] });
		return;
	}

	const results = await searchAll(projectId, query);
	reply.code(200).send({ results });
}