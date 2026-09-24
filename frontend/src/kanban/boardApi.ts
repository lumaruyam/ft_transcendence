// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls backing the /app/:id kanban board.

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  projectId: string;
  title: string;
  lists: List[];
}

// fetchBoardForProject loads the board to render on the kanban page.
// TODO: no matching backend endpoint yet — backend/src/modules/kanban/kanban.routes.ts only
// exposes GET /boards/:id (by board id), not "the board for project X". Needs a route added
// (e.g. GET /api/projects/:projectId/board) before this can be wired for real.
export async function fetchBoardForProject(projectId: string): Promise<Board> {
  throw new Error("not implemented");
}
