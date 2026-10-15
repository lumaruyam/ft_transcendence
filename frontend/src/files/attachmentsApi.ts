// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: frontend API calls for the File upload module.
import { apiRequest, API_PREFIX } from "../api/apiClient";
import { getStoredToken } from "../auth/authClient";

export interface Attachment {
	id: string;
	projectId: string;
	cardId: string | null;
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
//download, delete, name, size of an attachment
export async function listAttachments(projectId: string): Promise<Attachment[]> {
	const { attachments } = await apiRequest<{ attachments: Attachment[] }>({
		method: "GET",
		path: `/attachments/${projectId}`,
	});
	return attachments;
}
//delete an attachment
export function deleteAttachment(projectId: string, id: string): Promise<void> {
	return apiRequest<void>({ method: "DELETE", path: `/attachments/${projectId}/${id}` });
}

//upload an attachment
export async function uploadAttachment(projectId: string, file: File): Promise<Attachment> {
	const form = new FormData();
	form.append("file", file);

	const response = await fetch(`${API_PREFIX}/attachments/${projectId}`, {
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

//download an attachment
export async function downloadAttachment(projectId: string, attachment: Attachment): Promise<void> {
	const response = await fetch(`${API_PREFIX}/attachments/${projectId}/${attachment.id}`, {
		headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` },
	});
	if (!response.ok) throw new Error("download_failed");

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = attachment.fileName;
	link.click();
	URL.revokeObjectURL(url);
}