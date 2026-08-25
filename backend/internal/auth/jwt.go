// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: issuing and validating JWT session tokens (golang-jwt), used by every authenticated request across all tracks.
package auth

import "time"

// Claims represents the payload embedded in a session JWT.
type Claims struct {
	UserID    uint
	ExpiresAt time.Time
}

// GenerateJWT issues a signed session token for a freshly authenticated user (email/password or OAuth).
func GenerateJWT(userID uint) (token string, err error) {
	// TODO: build Claims with an expiry (e.g. 24h) and sign with the server's JWT secret
	// TODO: pull the signing secret from environment config, never hardcode it
	return "", nil
}

// ValidateJWT parses and verifies a token presented on an incoming request, for use by permissions middleware.
func ValidateJWT(token string) (*Claims, error) {
	// TODO: parse and verify signature/expiry
	// TODO: return a typed error distinguishing "expired" from "invalid" so handlers can respond appropriately
	return nil, nil
}

// RefreshJWT issues a new token ahead of expiry so long sessions don't force a re-login mid-use.
func RefreshJWT(token string) (newToken string, err error) {
	// TODO: validate the existing token, then issue a new one with a rolled-forward expiry
	return "", nil
}
