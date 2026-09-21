//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//create, list, and mark notifications as read for a user
import type { Notification, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

//create a notification for a user with prisma.notification.create
export async function createNotification(
	userId: string,//the notification to whom
	notifType: string,//card, note, file, etc.
	payload: unknown,//the JSON payload of the notification
): Promise<Notification> {
	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		throw new Error("payload must be a JSON object");
	}

	return prisma.notification.create({
		data: { 
		userId, 
		type: notifType, 
		payload: payload as Prisma.InputJsonObject },
	});
}

//returns all notifications with prisma.notification.findMany
export async function listNotifications(userId: string): Promise<Notification[]> {
	return prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}   

//marks a notification as read with prisma.notification.update
export async function markNotificationRead(id: string): Promise<void> {
	await prisma.notification.update({
		where: { id },
		data: { readAt: new Date() },//set readAt of this notification to now
	});
}