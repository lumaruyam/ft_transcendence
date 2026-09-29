// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: broadcasting card/list/board mutation events to every other client in a project's room, after the mutation is saved to Postgres. TS equivalent of backend/internal/kanban/broadcast.go (Go skeleton, removed).
import type { Card } from "@prisma/client";
import { getIO } from "./hub";

export interface KanbanEvent {
  type: string;
  payload: unknown;
}

// broadcastToProject sends an event to every connected client in a project's room (Socket.IO room = projectId).
export function broadcastToProject(projectId: string, event: KanbanEvent): void {
  // TODO: getIO().to(projectId).emit(event.type, event.payload) — Socket.IO's room emit replaces the Go hub's manual client iteration
  // TODO: this is the "silent state sync" described in the plan — not a user-facing notification
}

// buildCardMutationEvent constructs the event payload for a card create/update/move/delete, called from cards.service.ts.
export function buildCardMutationEvent(eventType: string, card: Card): KanbanEvent {
  // TODO: shape the payload the frontend message handler (frontend/src/kanban/wsClient.ts, using socket.io-client) expects
  return { type: eventType, payload: card };
}
