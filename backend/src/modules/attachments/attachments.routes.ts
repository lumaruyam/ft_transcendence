// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for uploading, listing, downloading and deleting attachments.
import { readFile } from "node:fs/promises";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import {
	uploadAttachment,
	listAttachments,
	getAttachment,
	attachmentPath,
	deleteAttachment,
	InvalidUploadError,
} from "./attachments.service.js";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MiB, same ceiling the service enforces

export async function registerAttachmentsRoutes(app: FastifyInstance): Promise<void> {
	// Registered here rather than in app.ts: a plugin registered inside a route module only applies
	// to that module's sub-instance, so no other track's routes change behaviour.
	await app.register(multipart, { limits: { fileSize: MAX_FILE_BYTES, files: 1 } });

	// projectId comes first in every path because requireRole only reads params.projectId.
	app.post("/:projectId", { preHandler: [requireAuth, requireRole("member")] }, uploadAttachmentHandler);
	app.get("/:projectId", { preHandler: [requireAuth, requireRole("viewer")] }, listAttachmentsHandler);
	app.get("/:projectId/:id", { preHandler: [requireAuth, requireRole("viewer")] }, getAttachmentHandler);
	app.delete("/:projectId/:id", { preHandler: [requireAuth, requireRole("member")] }, deleteAttachmentHandler);
}

// uploadAttachmentHandler takes one multipart file and records it. An optional ?cardId= attaches
// the file to a card rather than to the project as a whole.
async function uploadAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userId = request.userId;
	if (!userId) {
		reply.code(401).send({ error: "unauthenticated" });
		return;
	}

	const { projectId } = request.params as { projectId: string };
	const { cardId } = request.query as { cardId?: string };

	const file = await request.file();
	if (!file) {
		reply.code(400).send({ error: "invalid_input", details: ["a file field is required"] });
		return;
	}

	// toBuffer() throws once the stream goes past the fileSize limit set above.
	let fileBuffer: Buffer;
	try {
		fileBuffer = await file.toBuffer();
	} catch {
		reply.code(413).send({ error: "file_too_large" });
		return;
	}

	try {
		const attachment = await uploadAttachment(userId, {
			projectId,
			cardId,
			fileName: file.filename,
			fileType: file.mimetype,
			fileBuffer,
		});
		reply.code(201).send({ attachment });
	} catch (err) {
		if (err instanceof InvalidUploadError) {
			reply.code(400).send({ error: "invalid_upload", details: err.details });
			return;
		}
		throw err;
	}
}

// listAttachmentsHandler returns a project's files, metadata only.
async function listAttachmentsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };

	const attachments = await listAttachments(projectId);
	reply.code(200).send({ attachments });
}

// getAttachmentHandler sends the stored file back.
async function getAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, id } = request.params as { projectId: string; id: string };

	const attachment = await getAttachment(projectId, id);
	if (attachment === null) {
		reply.code(404).send({ error: "attachment_not_found" });
		return;
	}

	// Read into memory rather than stream: MAX_FILE_BYTES caps a file at 10 MiB, and a Buffer
	// response avoids the stream lifecycle, which this stack cuts short.
	let data: Buffer;
	try {
		data = await readFile(attachmentPath(attachment));
	} catch {
		// the row exists but the file is gone from the volume
		reply.code(404).send({ error: "attachment_not_found" });
		return;
	}

	// "attachment" rather than "inline": the browser saves the file instead of rendering it on our
	// own origin. filename*=UTF-8'' is the encoding that survives non-ASCII names.
	reply
		.header("Content-Type", attachment.fileType)
		.header("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`)
		.send(data);
}

// deleteAttachmentHandler removes the record and the stored file.
async function deleteAttachmentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, id } = request.params as { projectId: string; id: string };

	const deleted = await deleteAttachment(projectId, id);
	if (!deleted) {
		reply.code(404).send({ error: "attachment_not_found" });
		return;
	}

	reply.code(204).send();
}