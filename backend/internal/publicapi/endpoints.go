// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the 5+ documented REST endpoints (GET/POST/PUT/DELETE) required by the Public API major module, wrapping Track 2/3/4's underlying entities.
package publicapi

import "net/http"

// GetCardsHandler lists cards for a project — GET /api/projects/{id}/cards.
func GetCardsHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: validate API key + rate limit (handled by middleware chain)
	// TODO: delegate to kanban package's card listing, serialize as documented JSON response
}

// CreateCardHandler creates a card via the public API — POST /api/projects/{id}/cards.
func CreateCardHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: validate request body against the documented schema
	// TODO: delegate to kanban.CreateCard; broadcasting still happens via Track 2 Person B's hub
}

// UpdateCardHandler updates a card via the public API — PUT /api/projects/{id}/cards/{cardId}.
func UpdateCardHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: validate request body, delegate to kanban.UpdateCard
}

// DeleteCardHandler deletes a card via the public API — DELETE /api/projects/{id}/cards/{cardId}.
func DeleteCardHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: delegate to kanban.DeleteCard
}

// GetProjectsHandler lists the caller's projects — GET /api/projects, the 5th documented endpoint.
func GetProjectsHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: delegate to projects.ListProjectsForUser
}
