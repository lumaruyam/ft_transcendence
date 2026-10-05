// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the shapes the kanban backend sends over HTTP and Socket.IO.

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  status?: string;
  linkedBranch?: string | null;
  linkedPrUrl?: string | null;
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

export interface Project {
  id: string;
  name: string;
}

export type Role = "admin" | "member" | "viewer";

export interface Member {
  userId: string;
  role: Role;
  user: { id: string; name: string; email: string; avatar: string | null };
}

// payload of the "card_moved" event and of the PUT /cards/:id/move response: the new card order of
// both lists (identical when the card stays in its list), so clients don't have to replay the shift
export interface CardMoved {
  cardId: string;
  fromListId: string;
  toListId: string;
  fromOrder: string[];
  toOrder: string[];
}
