// Owner: Track 3 (Git integration)
// Responsible for: audit logging every webhook event received, so the automation chain is debuggable if a card doesn't move correctly.
package git

import (
	"context"

	"ft-transcendence/internal/db"
)

// LogWebhookEvent records a received webhook event in webhook_events, regardless of whether processing succeeded.
func LogWebhookEvent(ctx context.Context, event db.WebhookEvent) error {
	// TODO: insert the row with provider, repo, event_type, raw payload, and processed_at left nil until processing completes
	return nil
}

// ListWebhookEvents returns the audit log for a repo, for a debugging/admin view.
func ListWebhookEvents(ctx context.Context, repoURL string) ([]db.WebhookEvent, error) {
	// TODO: query webhook_events filtered by repo, most recent first
	return nil, nil
}
