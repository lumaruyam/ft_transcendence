// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: HTTP middleware enforcing authentication and role-based access for the Advanced permissions module.
package permissions

import "net/http"

// RequireAuth rejects requests without a valid JWT before they reach a handler.
func RequireAuth(next http.Handler) http.Handler {
	// TODO: extract and validate the JWT via auth.ValidateJWT, attach the user ID to the request context
	// TODO: respond 401 if missing/invalid
	return next
}

// RequireRole rejects requests from users whose project role doesn't meet the minimum required role.
func RequireRole(minRole Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		// TODO: read project ID from the route, look up the caller's role via GetUserRole
		// TODO: compare against minRole's privilege level; respond 403 if insufficient
		// TODO: this is the enforcement point Track 2 Person A coordinates with for card/board permission checks
		return next
	}
}
