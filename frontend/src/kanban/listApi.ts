// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls for list (column) CRUD and reordering.

interface KanbanList {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

// createList adds a new column to a board.
async function createList(boardId: string, title: string): Promise<KanbanList> {
  // TODO: POST /api/lists
  throw new Error("not implemented");
}

// updateList renames a list.
async function updateList(listId: string, title: string): Promise<KanbanList> {
  // TODO: PUT /api/lists/{listId}
  throw new Error("not implemented");
}

// deleteList removes a list.
async function deleteList(listId: string): Promise<void> {
  // TODO: DELETE /api/lists/{listId}
}

// reorderLists persists a new column order after a drag-and-drop reorder.
async function reorderLists(boardId: string, orderedListIds: string[]): Promise<void> {
  // TODO: PUT /api/boards/{boardId}/lists/order
}
