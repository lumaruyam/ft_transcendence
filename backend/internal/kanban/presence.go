// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: presence tracking (who's online) and reconnection handling, both required by the mandatory multi-user support requirement.
package kanban

// BroadcastPresence sends a "joined"/"left" event to a project's room on client connect/disconnect.
func (h *Hub) BroadcastPresence(projectID uint, userID uint, status string) {
	// TODO: status is "joined" or "left"; broadcast via BroadcastToProject so presence indicators update live
}

// HandleReconnect re-syncs a client's state after a dropped-then-restored WebSocket connection.
func (h *Hub) HandleReconnect(client *Client) {
	// TODO: on reconnect, don't assume the socket resumed cleanly — have the client re-fetch current board state over HTTP
	// TODO: re-register the client and re-broadcast presence
}
