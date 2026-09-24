// Owner: Track 2 (Person B — WebSocket layer)

import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { broadcastPresence, handleReconnect } from "./presence.js";

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

  // TEMPORARY: only checks a token was sent, doesn't verify it.
  // TODO(Track 1): call validateJwt here once auth/jwt.service.ts implements it.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      next(new Error("unauthorized"));
      return;
    }
    socket.data.userId = token;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join_project", (projectId: string) => {
      if (typeof projectId !== "string" || projectId.length === 0) return;
      // TODO(permissions): verify socket.data.userId is a member of projectId — any
      // authenticated socket can currently join any project's room.
      socket.data.projectId = projectId;
      socket.join(projectId);
      handleReconnect(socket.id, projectId, socket.data.userId);
    });

    socket.on("leave_project", (projectId: string) => {
      if (typeof projectId !== "string" || projectId.length === 0) return;
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

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO server not initialized — call createKanbanHub first");
  }
  return io;
}
