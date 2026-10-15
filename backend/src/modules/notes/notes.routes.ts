//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: notes HTTP routes while live editing goes through the socket hub
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { answer } from "../folders/documentError.js";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import { closeLiveNote } from "./notes.collab.js";
import {
	createNote,
	deleteNote,
	getNote,
	linkNoteToCard,
	listNotes,
	unlinkNoteFromCard,
	updateNote,
} from "./notes.service.js";

export async function registerNotesRoutes(app: FastifyInstance): Promise<void> {
	// projectId must come first in every path because requireRole reads params projectId
	app.get("/:projectId", { preHandler: [requireAuth, requireRole("viewer")] }, listHandler);
	app.post(
		"/:projectId",
		{
			preHandler: [requireAuth, requireRole("member")],
			schema: {
				body: {
					type: "object",
					additionalProperties: false,
					properties: { title: { type: "string" } },
				},
			},
		},
		createHandler,
	);
	app.get("/:projectId/:noteId", { preHandler: [requireAuth, requireRole("viewer")] }, getHandler);
	app.patch(
		"/:projectId/:noteId",
		{
			preHandler: [requireAuth, requireRole("member")],
			schema: {
				body: {
					type: "object",
					additionalProperties: false,
					properties: { title: { type: "string" } },
				},
			},
		},
		updateHandler,
	);
	app.delete("/:projectId/:noteId", { preHandler: [requireAuth, requireRole("member")] }, deleteHandler);
	app.put("/:projectId/:noteId/cards/:cardId", { preHandler: [requireAuth, requireRole("member")] }, linkHandler);
	app.delete("/:projectId/:noteId/cards/:cardId", { preHandler: [requireAuth, requireRole("member")] }, unlinkHandler);
}

async function listHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const { cardId } = request.query as { cardId?: string };
	reply.code(200).send({ notes: await listNotes(projectId, cardId) });
}

async function createHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const body = (request.body ?? {}) as { title?: string };
	await answer(reply, async () => {
		const note = await createNote(projectId, request.userId as string, body);
		reply.code(201).send({ note });
	});
}

async function getHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, noteId } = request.params as { projectId: string; noteId: string };
	const note = await getNote(projectId, noteId);
	if (!note) {
		reply.code(404).send({ error: "note_not_found" });
		return;
	}
	reply.code(200).send({ note });
}

async function updateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, noteId } = request.params as { projectId: string; noteId: string };
	const body = (request.body ?? {}) as { title?: string };
	await answer(reply, async () => {
		reply.code(200).send({ note: await updateNote(projectId, noteId, body) });
	});
}

async function deleteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, noteId } = request.params as { projectId: string; noteId: string };
	await answer(reply, async () => {
		await deleteNote(projectId, noteId);
		closeLiveNote(noteId);
		reply.code(204).send();
	});
}

async function linkHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, noteId, cardId } = request.params as { projectId: string; noteId: string; cardId: string };
	await answer(reply, async () => {
		await linkNoteToCard(projectId, noteId, cardId);
		reply.code(204).send();
	});
}

async function unlinkHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, noteId, cardId } = request.params as { projectId: string; noteId: string; cardId: string };
	await answer(reply, async () => {
		await unlinkNoteFromCard(projectId, noteId, cardId);
		reply.code(204).send();
	});
}
