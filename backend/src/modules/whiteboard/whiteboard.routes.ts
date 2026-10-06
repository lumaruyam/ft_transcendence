// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for the shared per-project whiteboard (load + autosave).
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Prisma } from "@prisma/client";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import { getWhiteboard, saveWhiteboard } from "./whiteboard.service.js";

//An Excalidraw scene with many shapes easily passes Fastify's default 1 MiB body limit.
const MAX_SCENE_BYTES = 5 * 1024 * 1024;//5 MiB
//add routes for the whiteboard to the Fastify app instance
export async function registerWhiteboardRoutes(app: FastifyInstance): Promise<void> {
	app.get("/:projectId", { preHandler: [requireAuth, requireRole("viewer")] }, getWhiteboardHandler);
	app.put(
		"/:projectId",
		{ preHandler: [requireAuth, requireRole("member")], bodyLimit: MAX_SCENE_BYTES },
		saveWhiteboardHandler,
	);
}

//return the project's saved scene (null if none yet).
async function getWhiteboardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };

	const whiteboard = await getWhiteboard(projectId);
	reply.code(200).send({ whiteboard });
}

//save a debounced scene from the frontend canvas.
async function saveWhiteboardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userId = request.userId;
	if (!userId) {
		reply.code(401).send({ error: "unauthenticated" });
		return;
	}

	const { projectId } = request.params as { projectId: string };
	const body = request.body as { sceneJson?: unknown } | undefined;
	const sceneJson = body?.sceneJson;

	if (typeof sceneJson !== "object" || sceneJson === null || Array.isArray(sceneJson)) {
		reply.code(400).send({ error: "invalid_input", details: ["sceneJson must be a JSON object"] });
		return;
	}
	//safe after the check above: sceneJson is a non-null, non-array object
	const scene = sceneJson as Prisma.InputJsonObject;

	const whiteboard = await saveWhiteboard(projectId, userId, scene);
	reply.code(200).send({ whiteboard });
}