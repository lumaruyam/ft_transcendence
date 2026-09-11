// Responsible for: typed fetch wrappers for the list endpoints (/api/lists, /api/boards/:boardId/lists/reorder).
import { BASE_URL, authHeaders, handleResponse } from "./kanbanApiClient.js";
import type { Card } from "./cardApi.js";

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

// Shape of GET /lists/:id includes its cards, ordered by position.
export interface ListWithCards extends List {
  cards: Card[];
}

export interface CreateListInput {
  boardId: string;
  title: string;
  position: number;
}

// All fields optional, PUT /lists/:id accepts a partial update (at least one field required).
export interface UpdateListInput {
  title?: string;
  position?: number;
}

export async function createList(input: CreateListInput): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<List>(res);
}

export async function getList(id: string): Promise<ListWithCards> {
  const res = await fetch(`${BASE_URL}/lists/${id}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<ListWithCards>(res);
}

export async function updateList(id: string, input: UpdateListInput): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<List>(res);
}

export async function deleteList(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/lists/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<void>(res);
}

// reorderLists persists a full drag-and-drop reorder for a board: orderedListIds is the
// complete new list order (each list's position becomes its index in the array).
export async function reorderLists(boardId: string, orderedListIds: string[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ orderedListIds }),
  });
  return handleResponse<void>(res);
}
