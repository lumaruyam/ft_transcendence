// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: presence tracking (who's online) and reconnection handling, both required by the mandatory multi-user support requirement. TS equivalent of backend/internal/kanban/presence.go (Go skeleton, removed).
import { broadcastToProject } from "./broadcast";

// broadcastPresence sends a "joined"/"left" event to a project's room on client connect/disconnect.
export function broadcastPresence(projectId: string, userId: string, status: "joined" | "left"): void {
  // TODO: broadcast via broadcastToProject so presence indicators update live
  broadcastToProject(projectId, { type: "presence", payload: { userId, status } });
}

// handleReconnect re-syncs a client's state after a dropped-then-restored Socket.IO connection.
export function handleReconnect(socketId: string, projectId: string): void {
  // TODO: Socket.IO auto-reconnects the transport, but don't assume in-memory state resumed cleanly —
  //       have the client re-fetch current board state over HTTP after the "connect" event fires again
  // TODO: re-join the project room and re-broadcast presence
}
