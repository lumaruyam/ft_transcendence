// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: frontend API calls for the notes module — load-latest and autosave-on-edit.
import { apiRequest } from "../api/apiClient";

//interface: what a Note returned by backend shoould be like?
export interface Note {
	id: string;
	projectId: string;
	contentJson: Record<string, unknown>;
	updatedBy: string | null;
	updatedAt: string;
}

//return the latest note for a project; obly called when the user opens the old note editor
export async function fetchLatestNote(projectId: string): Promise<Note | null> {
	const { note } = await apiRequest<{ note: Note | null }>({
		method: "GET",
		path: `/notes/${projectId}`,
	});
	return note;
}

//autosave the note content on every edit; last save wins if two people type at the same time.
export async function autosaveNote(projectId: string, contentJson: Record<string, unknown>): Promise<void> {
	await apiRequest<unknown>({
		method: "PUT",
		path: `/notes/${projectId}`,
		body: { contentJson },
	});
}