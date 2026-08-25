// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the WebSocket hub — a map of project_id to connected clients — covering the Major "real-time features" module.
package kanban

import "sync"

// Client represents one connected WebSocket connection (one browser tab).
type Client struct {
	UserID    uint
	ProjectID uint
	Send      chan []byte
}

// Hub tracks all connected clients grouped by project room.
type Hub struct {
	mu    sync.RWMutex
	rooms map[uint]map[*Client]bool
}

// NewHub constructs an empty Hub, created once in main.go and shared across the server.
func NewHub() *Hub {
	// TODO: initialize the rooms map
	return &Hub{}
}

// Register adds a client to its project's room on WebSocket connect.
func (h *Hub) Register(client *Client) {
	// TODO: add client to h.rooms[client.ProjectID] under the write lock
	// TODO: trigger a "joined" presence broadcast (see presence.go)
}

// Unregister removes a client from its project's room on disconnect.
func (h *Hub) Unregister(client *Client) {
	// TODO: remove client from its room under the write lock, close its Send channel
	// TODO: trigger a "left" presence broadcast (see presence.go)
}

// Run is the hub's main loop, started once at server boot in a goroutine from main.go.
func (h *Hub) Run() {
	// TODO: process register/unregister/broadcast requests from internal channels
	// TODO: this must be safe under concurrent access from many goroutines (gorilla/websocket read/write pumps)
}
