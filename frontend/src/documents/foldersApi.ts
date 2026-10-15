// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: frontend API calls for the folder tree of the Files page
import { ApiError, apiRequest } from "../api/apiClient";

export interface Folder {
	id: string;
	projectId: string;
	parentId: string | null;
	name: string;
	createdBy: string | null;
	createdAt: string;
}

export interface FolderLimits {
	maxSubfolders: number;
	maxDepth: number;
}

export function listFolders(projectId: string): Promise<{ folders: Folder[]; limits: FolderLimits }> {
	return apiRequest({ method: "GET", path: `/folders/${projectId}` });
}

export async function createFolder(projectId: string, name: string, parentId: string | null): Promise<Folder> {
	const { folder } = await apiRequest<{ folder: Folder }>({
		method: "POST",
		path: `/folders/${projectId}`,
		body: { name, parentId },
	});
	return folder;
}

export async function updateFolder(
	projectId: string,
	id: string,
	patch: { name?: string; parentId?: string | null },
): Promise<Folder> {
	const { folder } = await apiRequest<{ folder: Folder }>({ method: "PATCH", path: `/folders/${projectId}/${id}`, body: patch });
	return folder;
}

export async function copyFolder(projectId: string, id: string, parentId: string | null): Promise<Folder> {
	const { folder } = await apiRequest<{ folder: Folder }>({
		method: "POST",
		path: `/folders/${projectId}/${id}/copy`,
		body: { parentId },
	});
	return folder;
}

export function deleteFolder(projectId: string, id: string): Promise<void> {
	return apiRequest<void>({ method: "DELETE", path: `/folders/${projectId}/${id}` });
}

export function describeDocumentError(error: unknown, limits?: FolderLimits): string {
	if (!(error instanceof ApiError)) return "L'opération a échoué.";
	switch (error.code) {
		case "max_depth_reached":
			return `Profondeur maximale atteinte (${limits?.maxDepth ?? 8} niveaux).`;
		case "max_subfolders_reached":
			return `Ce dossier contient déjà le maximum de sous-dossiers (${limits?.maxSubfolders ?? 60}).`;
		case "folder_not_empty":
			return "Ce dossier n'est pas vide : déplacez ou supprimez d'abord son contenu.";
		case "folder_cycle":
			return "Un dossier ne peut pas être déplacé dans lui-même.";
		case "invalid_name":
			return "Le nom doit faire entre 1 et 100 caractères.";
		case "invalid_title":
			return "Le titre doit faire entre 1 et 200 caractères.";
		case "folder_not_found":
			return "Ce dossier n'existe plus.";
		case "insufficient_role":
			return "Vous n'avez pas le droit de faire cela.";
		default:
			return "L'opération a échoué.";
	}
}
