// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the Notification minor module — fires on creation, update, and deletion actions across cards, notes, and files.
package notifications

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateNotification inserts a notification for a user, called by Kanban, notes, attachments, and git event processing.
func CreateNotification(ctx context.Context, userID uint, notifType string, payload string) (*db.Notification, error) {
	// TODO: insert the notifications row
	// TODO: consider also pushing this over the Kanban WebSocket hub for instant delivery, distinct from the silent state-sync broadcasts
	return nil, nil
}

// ListNotifications returns a user's notifications, most recent first, for the notification bell/inbox.
func ListNotifications(ctx context.Context, userID uint) ([]db.Notification, error) {
	// TODO: query notifications for user_id, ordered by created_at desc
	return nil, nil
}

// MarkNotificationRead marks a single notification as read.
func MarkNotificationRead(ctx context.Context, id uint) error {
	// TODO: set read_at to now for the given notification row
	return nil
}
