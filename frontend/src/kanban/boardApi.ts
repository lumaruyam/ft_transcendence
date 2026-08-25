// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls for board CRUD.

interface Board {
  id: string;
  projectId: string;
  title: string;
}

// fetchBoard loads a board (with its lists/cards) for the Kanban page.
async function fetchBoard(boardId: string): Promise<Board> {
  // TODO: GET /api/boards/{boardId} via the shared apiClient
  throw new Error("not implemented");
}

// createBoard creates a new board within a project.
async function createBoard(projectId: string, title: string): Promise<Board> {
  // TODO: validate title client-side, then POST /api/boards
  throw new Error("not implemented");
}

// deleteBoard removes a board.
async function deleteBoard(boardId: string): Promise<void> {
  // TODO: DELETE /api/boards/{boardId}
}
