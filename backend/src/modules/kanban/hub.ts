// Owner: Track 2 (Person B — WebSocket layer)

import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { broadcastPresence, handleReconnect } from "./presence.js";
import { validateJwt, JwtExpiredError } from "../auth/jwt.service.js";
import { getUserRole } from "../permissions/roles.service.js";

declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

let io: SocketIOServer | null = null;

export function createKanbanHub(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    // `||` not `??`: docker-compose passes CORS_ORIGIN through as "" when unset in .env
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  });

  // The JWT sent in the handshake (auth.token) is verified here, the same way requireAuth does for HTTP.
  // socket.data.userId is the verified user id, never the raw token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      next(new Error("unauthorized"));
      return;
    }
    try {
      socket.data.userId = validateJwt(token).userId;
      next();
    } catch (err) {
      next(new Error(err instanceof JwtExpiredError ? "token_expired" : "unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_project", async (projectId: string) => {
      if (typeof projectId !== "string" || projectId.length === 0) return;
      // only members of the project (any role) may listen to its room
      const role = await getUserRole(projectId, socket.data.userId);
      if (!role) {
        socket.emit("join_denied", { projectId });
        return;
      }
      socket.data.projectId = projectId;
      socket.join(projectId);
      handleReconnect(socket.id, projectId, socket.data.userId);
    });

    socket.on("leave_project", (projectId: string) => {
      if (typeof projectId !== "string" || projectId.length === 0) return;
      if (!socket.rooms.has(projectId)) return;
      socket.leave(projectId);
      broadcastPresence(projectId, socket.data.userId, "left");
      if (socket.data.projectId === projectId) {
        socket.data.projectId = undefined;
      }
    });

    socket.on("disconnect", () => {
      if (socket.data.projectId) {
        broadcastPresence(socket.data.projectId, socket.data.userId, "left");
      }
    });
  });

  return io;
}

// getIOIfReady returns null instead of throwing when the hub isn't running (sandbox server, scripts)
export function getIOIfReady(): SocketIOServer | null {
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO server not initialized — call createKanbanHub first");
  }
  return io;
}
