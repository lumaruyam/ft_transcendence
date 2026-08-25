// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: rate limiting for the Public API major module, per the api_keys.rate_limit column.
package publicapi

import (
	"context"
	"net/http"
)

// RateLimitMiddleware enforces the per-key rate limit before a public API handler runs.
func RateLimitMiddleware(next http.Handler) http.Handler {
	// TODO: extract the validated APIKey from request context (set by the API key auth middleware)
	// TODO: call CheckRateLimit and respond 429 Too Many Requests if exceeded
	return next
}

// CheckRateLimit checks and increments the request count for an API key within the current window.
func CheckRateLimit(ctx context.Context, apiKeyID uint) (allowed bool, err error) {
	// TODO: implement a token-bucket or fixed-window counter, likely backed by an in-memory store or Redis
	// TODO: compare current usage against the key's configured rate_limit
	return true, nil
}
