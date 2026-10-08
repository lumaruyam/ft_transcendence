// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls backing the /app/:id kanban board. Everything goes through
// apiRequest (api/apiClient.ts), which adds the JWT and logs the user out on an expired session.
import { apiRequest } from "../api/apiClient";
import type { Board, Card, CardMoved, List, Member, Project } from "./types";

type ListRow = Omit<List, "cards">;

export async function fetchProject(projectId: string): Promise<Project> {
  const { project } = await apiRequest<{ project: Project }>({ method: "GET", path: `/projects/${projectId}` });
  return project;
}

export function fetchBoardForProject(projectId: string): Promise<Board> {
  return apiRequest<Board>({ method: "GET", path: `/projects/${projectId}/board` });
}

export async function fetchMembers(projectId: string): Promise<Member[]> {
  const { members } = await apiRequest<{ members: Member[] }>({ method: "GET", path: `/projects/${projectId}/members` });
  return members;
}

export function createList(boardId: string, title: string, position: number): Promise<ListRow> {
  return apiRequest<ListRow>({ method: "POST", path: "/lists", body: { boardId, title, position } });
}

export function renameList(listId: string, title: string): Promise<ListRow> {
  return apiRequest<ListRow>({ method: "PUT", path: `/lists/${listId}`, body: { title } });
}

export function deleteList(listId: string): Promise<void> {
  return apiRequest<void>({ method: "DELETE", path: `/lists/${listId}` });
}

export function reorderLists(boardId: string, orderedListIds: string[]): Promise<void> {
  return apiRequest<void>({ method: "PUT", path: `/boards/${boardId}/lists/reorder`, body: { orderedListIds } });
}

export function createCard(listId: string, title: string, position: number): Promise<Card> {
  return apiRequest<Card>({ method: "POST", path: "/cards", body: { listId, title, position } });
}

export function updateCard(cardId: string, patch: { title?: string; description?: string }): Promise<Card> {
  return apiRequest<Card>({ method: "PUT", path: `/cards/${cardId}`, body: patch });
}

export function moveCard(cardId: string, listId: string, position: number): Promise<CardMoved> {
  return apiRequest<CardMoved>({ method: "PUT", path: `/cards/${cardId}/move`, body: { listId, position } });
}

export function deleteCard(cardId: string, keepalive = false): Promise<void> {
  return apiRequest<void>({ method: "DELETE", path: `/cards/${cardId}`, keepalive });
}
