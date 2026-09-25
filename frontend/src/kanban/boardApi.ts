// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls backing the /app/:id kanban board.
//
// uses fetch directly instead of the shared api client since that module is still a stub

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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${path}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function fetchBoardForProject(projectId: string): Promise<Board> {
  return apiFetch<Board>(`/api/projects/${projectId}/board`);
}

export async function createList(boardId: string, title: string, position: number): Promise<List> {
  const list = await apiFetch<Omit<List, "cards">>("/api/lists", {
    method: "POST",
    body: JSON.stringify({ boardId, title, position }),
  });
  return { ...list, cards: [] };
}

export async function createCard(listId: string, title: string, position: number): Promise<Card> {
  return apiFetch<Card>("/api/cards", {
    method: "POST",
    body: JSON.stringify({ listId, title, position }),
  });
}

export async function updateCardTitle(cardId: string, title: string): Promise<Card> {
  return apiFetch<Card>(`/api/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

export async function updateListTitle(listId: string, title: string): Promise<Omit<List, "cards">> {
  return apiFetch<Omit<List, "cards">>(`/api/lists/${listId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await apiFetch<void>(`/api/cards/${cardId}`, { method: "DELETE" });
}

export async function deleteList(listId: string): Promise<void> {
  await apiFetch<void>(`/api/lists/${listId}`, { method: "DELETE" });
}
