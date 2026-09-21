// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: Fastify route handlers for the notification inbox/bell.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import { listNotifications, markNotificationRead } from "./notifications.service.js";

export async function registerNotificationsRoutes(app: FastifyInstance): Promise<void> {
	app.get("/", { preHandler: requireAuth }, listNotificationsHandler);
	app.put("/:id/read", { preHandler: requireAuth }, markReadHandler);
}

//list notifications when GET /notifications
async function listNotificationsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userId = request.userId;
	if (!userId) {
		reply.code(401).send({ error: "unauthenticated" });
		return;
	}

	const notifications = await listNotifications(userId);
	reply.code(200).send({ notifications });
}

//mark a notification as read when PUT /notifications/:id/read
async function markReadHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userId = request.userId;
	if (!userId) {
		reply.code(401).send({ error: "unauthenticated" });
		return;
	}
  //take id of notification from request.params(URL path)
	const { id } = request.params as { id: string };

	const updated = await markNotificationRead(id, userId);
	if (!updated) {
		// 404: notification not exist; 403: not right to view this notification; 401: not logged in
		reply.code(404).send({ error: "notification_not_found" });
		return;
	}
	reply.code(204).send();//204: no content is returned, but success
}
