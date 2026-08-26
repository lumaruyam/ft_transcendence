// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: process entrypoint — loads config, connects the database, builds the Fastify app, attaches the Socket.IO Kanban hub, and starts listening. Replaces backend/cmd/server/main.go (Go skeleton, removed).
import "dotenv/config";
import { loadConfig } from "./config/env";
import { buildApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./db/prisma/client";
import { createKanbanHub } from "./modules/kanban/hub";

async function main(): Promise<void> {
  // TODO: const config = loadConfig()
  // TODO: await connectDatabase()
  // TODO: const app = buildApp(config)
  // TODO: attach Socket.IO to app.server (Fastify's underlying Node http.Server) via createKanbanHub(app.server)
  // TODO: await app.listen({ port: config.port, host: "0.0.0.0" }) — TLS termination happens at the Nginx reverse proxy per infra/nginx
  // TODO: register SIGTERM/SIGINT handlers that close the Socket.IO hub, close Fastify, then call disconnectDatabase()
}

main().catch((err) => {
  // TODO: log the startup error with the configured logger and exit(1)
  process.exit(1);
});
