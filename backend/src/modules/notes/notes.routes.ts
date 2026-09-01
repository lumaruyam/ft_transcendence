// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for the shared per-project note (load + autosave).
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware";
import { getLatestNote, autosaveNote } from "./notes.service";

export function registerNotesRoutes(app: FastifyInstance): void {
  app.get("/:projectId", { preHandler: requireAuth }, getNoteHandler);
  app.put("/:projectId", { preHandler: requireAuth }, autosaveNoteHandler);
}

// getNoteHandler returns the current saved note for a project.
async function getNoteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call getLatestNote(request.params.projectId)
}

// autosaveNoteHandler persists a debounced edit from the frontend editor.
async function autosaveNoteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { contentJson } → call autosaveNote(request.params.projectId, request.userId, contentJson)
}
