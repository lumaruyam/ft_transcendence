// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: frontend API calls for the File upload module.
import { apiRequest, API_PREFIX } from "../api/apiClient";
import { getStoredToken } from "../auth/authClient";

export interface Attachment {
	id: string;
	projectId: string;
	folderId: string | null;
	cardIds: string[];
	fileUrl: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	uploadedBy: string | null;
	uploadedAt: string;
}


export class UploadError extends Error {
	readonly status: number;
	readonly details: string[];

	constructor(code: string, details: string[], status: number) {
		super(code);
		this.name = "UploadError";
		this.status = status;
		this.details = details;
	}
}
export async function listAttachments(projectId: string, cardId?: string): Promise<Attachment[]> {
	const { attachments } = await apiRequest<{ attachments: Attachment[] }>({
		method: "GET",
		path: `/attachments/${projectId}${cardId ? `?cardId=${encodeURIComponent(cardId)}` : ""}`,
	});
	return attachments;
}

export async function moveAttachment(projectId: string, id: string, folderId: string | null): Promise<Attachment> {
	const { attachment } = await apiRequest<{ attachment: Attachment }>({
		method: "PATCH",
		path: `/attachments/${projectId}/${id}`,
		body: { folderId },
	});
	return attachment;
}

export async function copyAttachment(projectId: string, id: string, folderId: string | null): Promise<Attachment> {
	const { attachment } = await apiRequest<{ attachment: Attachment }>({
		method: "POST",
		path: `/attachments/${projectId}/${id}/copy`,
		body: { folderId },
	});
	return attachment;
}

export function linkAttachmentToCard(projectId: string, id: string, cardId: string): Promise<void> {
	return apiRequest<void>({ method: "PUT", path: `/attachments/${projectId}/${id}/cards/${cardId}` });
}

export function unlinkAttachmentFromCard(projectId: string, id: string, cardId: string): Promise<void> {
	return apiRequest<void>({ method: "DELETE", path: `/attachments/${projectId}/${id}/cards/${cardId}` });
}
export function deleteAttachment(projectId: string, id: string): Promise<void> {
	return apiRequest<void>({ method: "DELETE", path: `/attachments/${projectId}/${id}` });
}

export async function uploadAttachment(projectId: string, file: File, folderId: string | null = null): Promise<Attachment> {
	const form = new FormData();
	form.append("file", file);

	const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
	const response = await fetch(`${API_PREFIX}/attachments/${projectId}${query}`, {
		method: "POST",
		headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` },
		body: form,
	});

	const payload = (await response.json().catch(() => ({}))) as {
		attachment?: Attachment;
		error?: string;
		details?: string[];
	};

	if (!response.ok || !payload.attachment) {
		throw new UploadError(payload.error ?? "upload_failed", payload.details ?? [], response.status);
	}
	return payload.attachment;
}

//the route needs the token so an img src cannot load it
export async function fetchAttachmentBlob(projectId: string, attachment: Attachment): Promise<Blob> {
	const response = await fetch(`${API_PREFIX}/attachments/${projectId}/${attachment.id}`, {
		headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` },
	});
	if (!response.ok) throw new Error("download_failed");
	return response.blob();
}

export function isImage(attachment: Attachment): boolean {
	return attachment.fileType.startsWith("image/");
}

export async function downloadAttachment(projectId: string, attachment: Attachment): Promise<void> {
	const blob = await fetchAttachmentBlob(projectId, attachment);
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = attachment.fileName;
	link.click();
	URL.revokeObjectURL(url);
}