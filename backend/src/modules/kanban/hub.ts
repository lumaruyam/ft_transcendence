// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the Socket.IO server and per-project rooms — covering the Major "real-time features" module. TS equivalent of backend/internal/kanban/hub.go (Go skeleton, removed); Socket.IO's built-in room support replaces the hand-rolled gorilla/websocket client map.
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";

// Expose the Socket.IO instance on the Fastify app (see server.ts) so route
// handlers and the shutdown hook can reach it without importing this module.
declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

let io: SocketIOServer | null = null;

// createKanbanHub attaches a Socket.IO server to the Node HTTP server Fastify created, called once from server.ts.
export function createKanbanHub(httpServer: HttpServer): SocketIOServer {
  // Minimal real implementation so the process starts and rooms work.
  // TODO: authenticate the socket (JWT passed via handshake auth) before allowing it to join a room
  // TODO: on "disconnect", trigger a "left" presence broadcast (see presence.ts)
  io = new SocketIOServer(httpServer, {
    // `||` not `??`: docker-compose passes CORS_ORIGIN through as "" when unset in .env
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  });

  io.on("connection", (socket) => {
    // Socket.IO rooms replace the Go hub's `map[project_id]map[*Client]bool`
    socket.on("join_project", (projectId: string) => {
      if (typeof projectId === "string" && projectId.length > 0) {
        socket.join(projectId);
      }
    });
    socket.on("leave_project", (projectId: string) => {
      if (typeof projectId === "string" && projectId.length > 0) {
        socket.leave(projectId);
      }
    });
  });

  return io;
}

// getIO returns the shared Socket.IO server instance for use by broadcast.ts and presence.ts.
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO server not initialized — call createKanbanHub first");
  }
  return io;
}
