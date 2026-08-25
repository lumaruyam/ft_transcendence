// Owner: Track 3 (Git integration)
// Responsible for: the webhook receiver endpoint for push, pull_request, and merge events — the core of the custom "Git/webhook integration" Major module.
package git

import (
	"context"
	"net/http"
)

// WebhookReceiverHandler receives GitHub/GitLab webhook POSTs registered by RegisterWebhook.
func WebhookReceiverHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: verify the request signature via VerifyWebhookSignature before trusting the payload
	// TODO: parse the event type (push/pull_request/merge) and dispatch to the matching Process*Event function in eventProcessor.go
	// TODO: log every received event via LogWebhookEvent regardless of processing outcome
}

// VerifyWebhookSignature validates the provider's HMAC signature header against the configured webhook secret.
func VerifyWebhookSignature(payload []byte, signature string, secret string) bool {
	// TODO: compute HMAC-SHA256 of payload with secret, constant-time compare against signature
	return false
}

// RegisterWebhook registers a webhook on the linked repository for push/pull_request/merge events.
func RegisterWebhook(ctx context.Context, repoURL string) error {
	// TODO: call the provider API to create the webhook pointing at this server's WebhookReceiverHandler URL
	return nil
}
