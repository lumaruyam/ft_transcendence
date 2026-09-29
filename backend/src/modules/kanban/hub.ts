// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the Socket.IO server and per-project rooms — covering the Major "real-time features" module. TS equivalent of backend/internal/kanban/hub.go (Go skeleton, removed); Socket.IO's built-in room support replaces the hand-rolled gorilla/websocket client map.
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

// createKanbanHub attaches a Socket.IO server to the Node HTTP server Fastify created, called once from server.ts.
export function createKanbanHub(httpServer: HttpServer): SocketIOServer {
  // TODO: instantiate `new SocketIOServer(httpServer, { cors: { origin: ... } })`
  // TODO: on "connection", authenticate the socket (JWT passed via handshake auth) before allowing it to join a room
  // TODO: on a "join_project" event, socket.join(projectId) — Socket.IO rooms replace the Go hub's `map[project_id]map[*Client]bool`
  // TODO: on "disconnect", trigger a "left" presence broadcast (see presence.ts)
  // TODO: store the io instance in the module-level `io` variable so broadcast.ts can reach it
  throw new Error("not implemented");
}

// getIO returns the shared Socket.IO server instance for use by broadcast.ts and presence.ts.
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO server not initialized — call createKanbanHub first");
  }
  return io;
}
