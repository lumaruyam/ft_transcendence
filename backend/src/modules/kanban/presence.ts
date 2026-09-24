// Owner: Track 2 (Person B — WebSocket layer)
import { broadcastToProject } from "./broadcast.js";

export function broadcastPresence(projectId: string, userId: string, status: "joined" | "left"): void {
  broadcastToProject(projectId, { type: "presence", payload: { userId, status } });
}

// Also covers reconnects: the client re-emits "join_project" on every "connect" event, so this
// runs again after a drop. Presence alone doesn't replay missed mutations — the client still
// refetches board state over HTTP after reconnecting.
export function handleReconnect(socketId: string, projectId: string, userId: string): void {
  broadcastPresence(projectId, userId, "joined");
}
