// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: frontend API calls for card CRUD and moves.

interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  linkedBranch?: string;
  linkedPrUrl?: string;
  status: string;
}

// createCard creates a new card, with frontend validation matching the backend's ValidateCardInput rules.
async function createCard(listId: string, title: string, description: string): Promise<Card> {
  // TODO: validate title required (mandatory dual validation requirement)
  // TODO: POST /api/cards — the resulting "card_created" broadcast is handled separately by Track 2 Person B's wsClient.ts
  throw new Error("not implemented");
}

// updateCard edits a card's fields.
async function updateCard(cardId: string, changes: Partial<Card>): Promise<Card> {
  // TODO: PUT /api/cards/{cardId}
  throw new Error("not implemented");
}

// moveCard relocates a card to a new list/position, called from the drag-and-drop handler.
async function moveCard(cardId: string, newListId: string, newPosition: number): Promise<Card> {
  // TODO: PUT /api/cards/{cardId}/move
  throw new Error("not implemented");
}

// deleteCard removes a card.
async function deleteCard(cardId: string): Promise<void> {
  // TODO: DELETE /api/cards/{cardId}
}
