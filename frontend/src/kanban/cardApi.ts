// Responsible for: typed fetch wrappers for the card endpoints (/api/cards).
import { BASE_URL, authHeaders, handleResponse } from "./kanbanApiClient.js";

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  linkedBranch: string | null;
  linkedPrUrl: string | null;
  status: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  listId: string;
  title: string;
  description?: string;
  position: number;
}

// All fields optional, PUT /cards/:id accepts a partial update (at least one field required).
export interface UpdateCardInput {
  title?: string;
  description?: string;
  position?: number;
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const res = await fetch(`${BASE_URL}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Card>(res);
}

export async function getCard(id: string): Promise<Card> {
  const res = await fetch(`${BASE_URL}/cards/${id}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<Card>(res);
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const res = await fetch(`${BASE_URL}/cards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Card>(res);
}

export async function deleteCard(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/cards/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<void>(res);
}
