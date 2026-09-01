// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for file upload/download/delete on cards/notes.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware";
import { uploadAttachment, getAttachment, deleteAttachment } from "./attachments.service";

export function registerAttachmentsRoutes(app: FastifyInstance): void {
  app.post("/", { preHandler: requireAuth }, uploadAttachmentHandler);
  app.get("/:id", { preHandler: requireAuth }, getAttachmentHandler);
  app.delete("/:id", { preHandler: requireAuth }, deleteAttachmentHandler);
}

// uploadAttachmentHandler stores an uploaded file (multipart) and records it.
async function uploadAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: parse multipart form (fastify-multipart) → { projectId, cardId?, fileName, fileType, fileBuffer }
  // TODO: call uploadAttachment(request.userId, input)
}

// getAttachmentHandler returns attachment metadata for download/preview.
async function getAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call getAttachment(request.params.id); 404 if null
}

// deleteAttachmentHandler removes an uploaded file and its record.
async function deleteAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call deleteAttachment(request.params.id)
}
