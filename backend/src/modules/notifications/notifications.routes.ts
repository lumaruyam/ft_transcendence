// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for the notification inbox/bell.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import { listNotifications, markNotificationRead } from "./notifications.service.js";

export async function registerNotificationsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", { preHandler: requireAuth }, listNotificationsHandler);
  app.put("/:id/read", { preHandler: requireAuth }, markReadHandler);
}

// listNotificationsHandler returns the caller's notifications, most recent first.
async function listNotificationsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call listNotifications(request.userId)
}

// markReadHandler marks a single notification as read.
async function markReadHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call markNotificationRead(request.params.id)
}
