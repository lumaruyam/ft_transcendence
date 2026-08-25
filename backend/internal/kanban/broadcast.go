// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: broadcasting card/list/board mutation events to every other client in a project's room, after the mutation is saved to Postgres.
package kanban

import "ft-transcendence/internal/db"

// Event is the JSON message shape sent to WebSocket clients.
type Event struct {
	Type    string
	Payload interface{}
}

// BroadcastToProject sends an event to every connected client in a project's room except optionally the sender.
func (h *Hub) BroadcastToProject(projectID uint, event Event) {
	// TODO: iterate h.rooms[projectID] under the read lock, push the serialized event onto each client's Send channel
	// TODO: this is the "silent state sync" described in the plan — not a user-facing notification
}

// BuildCardMutationEvent constructs the WS event payload for a card create/update/move/delete, called from cards.go.
func BuildCardMutationEvent(eventType string, card *db.Card) Event {
	// TODO: shape the payload the frontend message handler (frontend/src/kanban/wsClient.ts) expects
	return Event{}
}
