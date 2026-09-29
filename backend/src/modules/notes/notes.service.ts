// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: notes CRUD and the autosave endpoint, storing content as JSON with last-save-wins conflict resolution. TS equivalent of backend/internal/notes/notes.go (Go skeleton, removed).
import type { Note } from "@prisma/client";

// getLatestNote loads the current saved note for a project, for whoever opens the notes page.
export async function getLatestNote(projectId: string): Promise<Note | null> {
  // TODO: prisma.note.findFirst({ where: { projectId } }) (one shared note per project, per the plan's scope)
  return null;
}

// autosaveNote persists a debounced edit from the Tiptap editor.
export async function autosaveNote(projectId: string, userId: string, contentJson: unknown): Promise<Note> {
  // TODO: validate contentJson is well-formed structured data
  // TODO: upsert the note's contentJson/updatedBy/updatedAt via prisma — last save wins, no conflict resolution by design
  // TODO: fire a notification via Track 4's notifications.service.ts ("note updated")
  throw new Error("not implemented");
}
