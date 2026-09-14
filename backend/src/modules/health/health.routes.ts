// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: a lightweight smoke-test endpoint. The /landing page calls this to
// visually confirm the full round-trip works: browser -> nginx -> backend -> Postgres.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma/client.js";

// registerHealthRoutes mounts GET /api/health, called from app.ts (prefix "/api").
export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    let db: "up" | "down" = "up";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "down";
    }

    return {
      status: "ok",
      service: "ft_transcendence backend",
      db,
      time: new Date().toISOString(),
    };
  });
}
