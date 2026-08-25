// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: OAuth2 login flow (GitHub/GitLab), covering the OAuth minor module and feeding the credential source Track 3 needs for Git API calls.
package auth

import (
	"context"

	"ft-transcendence/internal/db"
)

// GetOAuthRedirectURL builds the provider consent-screen URL the frontend redirects the user to.
func GetOAuthRedirectURL(provider string) (string, error) {
	// TODO: look up the client ID/redirect URI for the given provider (github/gitlab) from config
	// TODO: build the authorize URL with the requested scopes (repo scope needed for Track 3's Git integration)
	return "", nil
}

// HandleOAuthCallback exchanges the provider's auth code for a token, creates/links the User, and returns them.
func HandleOAuthCallback(ctx context.Context, provider string, code string) (*db.User, error) {
	// TODO: exchange code for an access token with the provider
	// TODO: fetch the provider profile and find-or-create the matching User row (oauth_provider, oauth_id)
	// TODO: persist the OAuth access token securely so Track 3's git package can use it for branch/webhook API calls
	return nil, nil
}

// LinkOAuthAccount attaches an OAuth identity to an already-authenticated user (adding OAuth on top of email/password).
func LinkOAuthAccount(ctx context.Context, userID uint, provider string, oauthID string) error {
	// TODO: verify the OAuth identity isn't already linked to a different account
	// TODO: update the user's oauth_provider/oauth_id fields
	return nil
}
