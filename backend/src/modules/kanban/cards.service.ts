// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for cards, including the linked-branch field populated by Track 3. TS equivalent of backend/internal/kanban/cards.go (Go skeleton, removed).
import type { Card } from "@prisma/client";

export interface CreateCardInput {
  listId: string;
  title: string;
  description?: string;
  assignee?: string;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  assignee?: string;
}

// createCard creates a new card in a list.
export async function createCard(input: CreateCardInput): Promise<Card> {
  // TODO: validate input via validateCardInput (title required, listId must exist and belong to the caller's project)
  // TODO: insert new card row via prisma.card.create
  // TODO: broadcast "card_created" event over Socket.IO to the project room (Track 2 Person B's hub)
  // TODO: return created card or validation/db error
  throw new Error("not implemented");
}

// updateCard edits a card's title/description/assignee/linked branch fields.
export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  // TODO: validate input, apply changes via prisma.card.update
  // TODO: broadcast "card_updated" event via the Socket.IO hub
  throw new Error("not implemented");
}

// moveCard relocates a card to a new list/position, driving the drag-and-drop UI.
export async function moveCard(cardId: string, newListId: string, newPosition: number): Promise<Card> {
  // TODO: validate the destination list belongs to the same project
  // TODO: update listId/position; this must be race-safe under concurrent moves per the mandatory multi-user requirement
  //       (wrap the read-then-write in a prisma.$transaction, or use a single atomic update where possible)
  // TODO: broadcast "card_moved" event via the Socket.IO hub
  throw new Error("not implemented");
}

// deleteCard removes a card.
export async function deleteCard(id: string): Promise<void> {
  // TODO: prisma.card.delete — cascades to attachments/git link via schema.prisma
  // TODO: broadcast "card_deleted" event via the Socket.IO hub
}
