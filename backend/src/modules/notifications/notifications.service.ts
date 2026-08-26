// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the Notification minor module — fires on creation, update, and deletion actions across cards, notes, and files. TS equivalent of backend/internal/notifications/notifications.go (Go skeleton, removed).
import type { Notification } from "@prisma/client";

// createNotification inserts a notification for a user, called by Kanban, notes, attachments, and git event processing.
export async function createNotification(
  userId: string,
  notifType: string,
  payload: unknown
): Promise<Notification> {
  // TODO: prisma.notification.create
  // TODO: consider also pushing this over the Kanban Socket.IO hub for instant delivery, distinct from the silent state-sync broadcasts
  throw new Error("not implemented");
}

// listNotifications returns a user's notifications, most recent first, for the notification bell/inbox.
export async function listNotifications(userId: string): Promise<Notification[]> {
  // TODO: prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
  return [];
}

// markNotificationRead marks a single notification as read.
export async function markNotificationRead(id: string): Promise<void> {
  // TODO: prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
}
