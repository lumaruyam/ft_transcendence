// Owner: Track 2 (Person B — WebSocket layer)
import type { Card } from "@prisma/client";
import { getIO } from "./hub.js";

export interface KanbanEvent {
  type: string;
  payload: unknown;
}

// broadcastToProject sends an event to every connected client in a project room
export function broadcastToProject(projectId: string, event: KanbanEvent): void {
  getIO().to(projectId).emit(event.type, event.payload);
}

// buildCardMutationEvent constructs the event payload for a card create/update/move/delete, called from cards.service.ts.
export function buildCardMutationEvent(eventType: string, card: Card): KanbanEvent {
  return { type: eventType, payload: card };
}
