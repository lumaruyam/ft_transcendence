// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the File upload minor module. Files live on disk under UPLOADS_DIR, which
// docker-compose mounts as a named volume; the database only stores metadata.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { Attachment } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { createNotification } from "../notifications/notifications.service.js";

// /app/uploads inside the container, backend/uploads locally (both gitignored).
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MiB

// Allow-list of accepted types. The extension written to disk comes from this map and never from
// the user's file name: a name like "../../etc/passwd" must not be able to steer where we write.
// SVG is deliberately absent — it can carry scripts, and we would be serving it from our own origin.
const ALLOWED_TYPES = new Map<string, string>([
	["image/png", ".png"],
	["image/jpeg", ".jpg"],
	["image/gif", ".gif"],
	["image/webp", ".webp"],
	["application/pdf", ".pdf"],
	["text/plain", ".txt"],
	["text/markdown", ".md"],
	["application/json", ".json"],
	["application/zip", ".zip"],
]);

export interface UploadAttachmentInput {
	projectId: string;
	cardId?: string;
	fileName: string;
	fileType: string;
	fileBuffer: Buffer;
}

// InvalidUploadError carries the reasons, so the route can answer 400 with details.
export class InvalidUploadError extends Error {
	readonly details: string[];

	constructor(details: string[]) {
		super("invalid_upload");
		this.name = "InvalidUploadError";
		this.details = details;
	}
}

// validateFileUpload checks type and size before anything touches the disk.
export function validateFileUpload(input: UploadAttachmentInput): string[] {
	const errors: string[] = [];

	if (input.fileName.trim() === "") errors.push("fileName is required");
	if (!ALLOWED_TYPES.has(input.fileType)) errors.push(`fileType ${input.fileType} is not allowed`);
	if (input.fileBuffer.length === 0) errors.push("the file is empty");
	if (input.fileBuffer.length > MAX_FILE_BYTES) {
		errors.push(`the file is larger than ${MAX_FILE_BYTES} bytes`);
	}

	return errors;
}

// uploadAttachment writes the file to disk, records it, and tells the other members about it.
export async function uploadAttachment(uploadedBy: string, input: UploadAttachmentInput): Promise<Attachment> {
	const errors = validateFileUpload(input);
	if (errors.length > 0) throw new InvalidUploadError(errors);

	const storedName = `${randomUUID()}${ALLOWED_TYPES.get(input.fileType) ?? ""}`;
	await mkdir(UPLOADS_DIR, { recursive: true });
	await writeFile(path.join(UPLOADS_DIR, storedName), input.fileBuffer);

	const attachment = await prisma.attachment.create({
		data: {
			projectId: input.projectId,
			cardId: input.cardId ?? null,
			fileUrl: storedName,
			fileName: input.fileName,
			fileSize: input.fileBuffer.length,
			fileType: input.fileType,
			uploadedBy,
		},
	});

	await notifyProjectMembers(attachment, uploadedBy);
	return attachment;
}

// Everyone on the project except the uploader hears about a new file.
async function notifyProjectMembers(attachment: Attachment, uploadedBy: string): Promise<void> {
	const members = await prisma.projectMember.findMany({
		where: { projectId: attachment.projectId, userId: { not: uploadedBy } },
		select: { userId: true },
	});

	await Promise.all(
		members.map((member) =>
			createNotification(member.userId, "file_uploaded", {
				attachmentId: attachment.id,
				projectId: attachment.projectId,
				fileName: attachment.fileName,
			}),
		),
	);
}

// listAttachments returns a project's files, newest first.
export async function listAttachments(projectId: string): Promise<Attachment[]> {
	return prisma.attachment.findMany({
		where: { projectId },
		orderBy: { uploadedAt: "desc" },
	});
}

// getAttachment is scoped by project on purpose: an id from another project must not resolve here,
// because the role check in the route only proves the caller's role on THIS project.
export async function getAttachment(projectId: string, id: string): Promise<Attachment | null> {
	return prisma.attachment.findFirst({ where: { id, projectId } });
}

// attachmentPath turns a stored record into the file's location on disk.
export function attachmentPath(attachment: Attachment): string {
	return path.join(UPLOADS_DIR, attachment.fileUrl);
}

// deleteAttachment removes the record and then the file. Returns false if there was nothing to delete.
export async function deleteAttachment(projectId: string, id: string): Promise<boolean> {
	const attachment = await getAttachment(projectId, id);
	if (attachment === null) return false;

	// The row goes first: a leftover file on disk is harmless, a row pointing at a missing file is not.
	await prisma.attachment.delete({ where: { id } });
	try {
		await unlink(attachmentPath(attachment));
	} catch {
		// already gone — nothing to clean up
	}

	return true;
}