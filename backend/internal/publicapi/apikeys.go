// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: API key issuance/validation for the Public API major module.
package publicapi

import (
	"context"

	"ft-transcendence/internal/db"
)

// IssueAPIKey generates a new API key scoped to a project, for external/script access to the public endpoints.
func IssueAPIKey(ctx context.Context, projectID uint) (*db.APIKey, error) {
	// TODO: generate a cryptographically random key, store only its hash (key_hash) via GORM
	// TODO: return the plaintext key exactly once to the caller — it can't be recovered later
	return nil, nil
}

// RevokeAPIKey disables a previously issued key.
func RevokeAPIKey(ctx context.Context, keyID uint) error {
	// TODO: delete or mark the api_keys row revoked
	return nil
}

// ValidateAPIKey checks an incoming request's API key header against stored key hashes.
func ValidateAPIKey(ctx context.Context, presentedKey string) (*db.APIKey, error) {
	// TODO: hash presentedKey and look up a matching api_keys row
	// TODO: return an error if not found/revoked, used by the public API auth middleware
	return nil, nil
}
