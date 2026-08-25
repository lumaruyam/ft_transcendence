// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: process entrypoint — wires up config, DB connection, router, and the Kanban WebSocket hub, then starts the HTTP server.
package main

func main() {
	// TODO: load .env / environment config (DB DSN, JWT secret, OAuth client IDs, port)
	// TODO: open the GORM/Postgres connection and call db.RunMigrations
	// TODO: construct the kanban.Hub (Track 2 Person B) and start its Run loop
	// TODO: build the chi router, mount auth/permissions/projects/kanban/notes/attachments/search/notifications/git/publicapi route groups
	// TODO: start the HTTP server (TLS termination happens at the Nginx reverse proxy per infra/nginx)
}

// setupRouter assembles the top-level route tree from each internal package's handlers.
func setupRouter() {
	// TODO: mount permissions.RequireAuth / RequireRole middleware on protected route groups
	// TODO: mount publicapi.RateLimitMiddleware + API key auth on the /api/* public routes
}
