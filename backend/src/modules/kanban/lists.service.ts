// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for lists (Kanban columns) within a board. TS equivalent of backend/internal/kanban/lists.go (Go skeleton, removed).
import type { List } from "@prisma/client";

export interface CreateListInput {
  boardId: string;
  title: string;
}

export interface UpdateListInput {
  title?: string;
  position?: number;
}

// createList creates a new list (column) on a board.
export async function createList(input: CreateListInput): Promise<List> {
  // TODO: validate input via validateListInput (title required, boardId must exist)
  // TODO: prisma.list.create, appended at the end of the board's list order
  throw new Error("not implemented");
}

// updateList renames or repositions a list.
export async function updateList(id: string, input: UpdateListInput): Promise<List> {
  // TODO: apply title/position changes via prisma.list.update
  throw new Error("not implemented");
}

// deleteList removes a list and its cards.
export async function deleteList(id: string): Promise<void> {
  // TODO: prisma.list.delete — cascades to cards; broadcast "list_deleted" via the Socket.IO hub
}

// reorderLists persists a new left-to-right ordering of a board's lists after a drag-and-drop reorder.
export async function reorderLists(boardId: string, orderedListIds: string[]): Promise<void> {
  // TODO: update each list's position field to match orderedListIds (e.g. prisma.$transaction of updates)
}
