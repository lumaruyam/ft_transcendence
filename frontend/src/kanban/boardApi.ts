// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: typed fetch wrappers for the board endpoints (POST/GET/DELETE /api/boards).
import { BASE_URL, authHeaders, handleResponse } from "./kanbanApiClient.js";
import type { ListWithCards } from "./listApi.js";

export interface Board {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
}

// Shape of GET /boards/:id — includes nested lists/cards, ordered by position.
export interface BoardWithLists extends Board {
  lists: ListWithCards[];
}

export interface CreateBoardInput {
  projectId: string;
  title: string;
}

export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const res = await fetch(`${BASE_URL}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Board>(res);
}

export async function getBoard(id: string): Promise<BoardWithLists> {
  const res = await fetch(`${BASE_URL}/boards/${id}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<BoardWithLists>(res);
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/boards/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<void>(res);
}
