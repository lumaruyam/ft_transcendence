// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the File upload minor module — attachments on cards/notes, and the destination for exported whiteboard images. TS equivalent of backend/internal/attachments/attachments.go (Go skeleton, removed).
import type { Attachment } from "@prisma/client";

export interface UploadAttachmentInput {
  projectId: string;
  cardId?: string;
  fileName: string;
  fileType: string;
  fileBuffer: Buffer;
}

// uploadAttachment stores an uploaded file and records it in the attachments table.
export async function uploadAttachment(uploadedBy: string, input: UploadAttachmentInput): Promise<Attachment> {
  // TODO: call validateFileUpload first (type/size checks)
  // TODO: write the file to storage (local disk volume or S3-compatible bucket) and get back a fileUrl
  // TODO: prisma.attachment.create (covers both regular uploads and whiteboard exports per the plan)
  // TODO: fire a notification via Track 4's notifications.service.ts ("file uploaded")
  throw new Error("not implemented");
}

// getAttachment fetches an attachment's metadata for download/preview.
export async function getAttachment(id: string): Promise<Attachment | null> {
  // TODO: prisma.attachment.findUnique
  return null;
}

// deleteAttachment removes an uploaded file and its record.
export async function deleteAttachment(id: string): Promise<void> {
  // TODO: remove the underlying stored file, then prisma.attachment.delete
}

// validateFileUpload checks file type/size against allowed limits before storage.
export function validateFileUpload(input: UploadAttachmentInput): string[] {
  // TODO: allow-list file types (images, documents, whiteboard PNG exports), enforce a max size
  return [];
}
