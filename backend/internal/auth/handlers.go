// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: HTTP handlers for signup/login/logout — the mandatory baseline user management required regardless of chosen modules.
package auth

import "net/http"

// SignupRequest is the validated shape of a signup form submission.
type SignupRequest struct {
	Email    string
	Password string
	Name     string
}

// SignupHandler creates a new user with a hashed/salted password.
func SignupHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: decode and validate the request body (email format, password strength) — backend half of the mandatory dual validation requirement
	// TODO: reject if the email is already registered
	// TODO: call HashPassword and insert a new User row via GORM
	// TODO: issue a JWT via GenerateJWT and return it to the client
}

// LoginHandler authenticates an email/password pair and returns a session token.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: look up the user by email
	// TODO: call VerifyPassword; return a generic "invalid credentials" error on failure (don't leak which field was wrong)
	// TODO: issue a JWT via GenerateJWT
}

// LogoutHandler invalidates the caller's current session.
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: clear the session cookie / instruct the client to drop the token (blocklist if server-side session tracking is added)
}

// ValidateSignupInput applies backend-side validation rules for signup fields.
func ValidateSignupInput(req SignupRequest) error {
	// TODO: validate email format, password minimum length/complexity, required name field
	return nil
}
