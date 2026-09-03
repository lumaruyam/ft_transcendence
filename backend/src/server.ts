/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/08/28 20:01:23 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/03 22:39:08 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: process entrypoint — loads config, connects the database, builds the Fastify app, attaches the Socket.IO Kanban hub, and starts listening. Replaces backend/cmd/server/main.go (Go skeleton, removed).
import "dotenv/config";
import { loadConfig } from "./config/env.js";
import { buildApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./db/prisma/client.js";
import { createKanbanHub } from "./modules/kanban/hub.js";

async function main(): Promise<void> {
	try {
		// Load config from env
		const config = loadConfig();
		console.log(`Starting server on ${config.host}:${config.port} in ${config.nodeEnv} mode`)

		// Connect Database
		await connectDatabase();
		console.log("Database connected");

		// Build Fastify app
		const app = buildApp(config);
		console.log("Fastify app built");

		// Attach Socket.IO to the Fastify server
		createKanbanHub(app.server);
		console.log("Socket.IO hub attached");

		// Start listening
		await app.listen({port: config.port, host: config.host});
		console.log(`Server listening on http://${config.host}:${config.port}`);

		// Handle shutdown (SIGTERM / SIGINT)
		// SIGTERM = SIGnal TERMinate kill signal from container/process managet
		// SIGINT = Ctrl + C
		const signals = ["SIGTERM", "SIGINT"];
		signals.forEach((signal) => {
			process.on(signal, async() => {
				console.log(`\n${signal} received, shutting down gracefully...`);

				try {
					// Close Socket.IO connections
					app.io = (app as any).io;
					if (io) {
						io.close();
					}//  changed from app.io?.close(); app.io is the Socket.IO instance, it manages all WebSocket connections and real-time communication
					console.log("Socket.IO hub closed");

					// Close Fastify
					await app.close();
					console.log("Fastify server closed");

					// Close database
					await disconnectDatabase();
					console.log("Database disconnected");
					console.log("Shutdown complete");
					process.exit(0);
				} catch (err) {
					console.error("Error during shutdown:", err);
					process.exit(1);
				}
			});
		});
	} catch (err) {
		console.error("Fatal error during startup:", err);
		process.exit(1);
	}
}

main().catch((err) => {
  console.error("Unhandled error in main", err);
  process.exit(1);
});
