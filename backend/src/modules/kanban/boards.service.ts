// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for boards, one per project. TS equivalent of backend/internal/kanban/boards.go (Go skeleton, removed).
import type { Board } from "@prisma/client";

export interface CreateBoardInput {
  projectId: string;
  title: string;
}

// createBoard creates a new board within a project.
export async function createBoard(input: CreateBoardInput): Promise<Board> {
  // TODO: validate input via validateBoardInput
  // TODO: prisma.board.create
  throw new Error("not implemented");
}

// getBoard fetches a board by ID, for the Kanban page load.
export async function getBoard(id: string): Promise<Board | null> {
  // TODO: prisma.board.findUnique, include its lists/cards for the initial render
  return null;
}

// deleteBoard removes a board and its lists/cards.
export async function deleteBoard(id: string): Promise<void> {
  // TODO: prisma.board.delete — cascades to lists/cards via schema.prisma's onDelete: Cascade
  // TODO: broadcast a "board_deleted" event via Track 2 Person B's Socket.IO hub so open clients react
}
