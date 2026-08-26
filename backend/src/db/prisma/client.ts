// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the shared Prisma client singleton, replacing the former GORM connection setup in backend/internal/db/migrations.go (Go skeleton, removed).
import { PrismaClient } from "@prisma/client";

// prisma is the single shared client instance imported by every module's service layer.
export const prisma = new PrismaClient();

// connectDatabase verifies connectivity at boot and is called once from server.ts before listen().
export async function connectDatabase(): Promise<void> {
  // TODO: call prisma.$connect() and fail fast (process.exit) on error
  // TODO: schema migrations are NOT run here — Prisma migrations are applied out-of-band via the CLI
  //       (`npx prisma migrate deploy` in production, `npx prisma migrate dev` locally), unlike the
  //       former Go skeleton's in-process RunMigrations(); see infra/migrations/0001_init.sql for the
  //       hand-maintained SQL baseline this schema should stay in sync with until Prisma Migrate owns it.
}

// disconnectDatabase is called on graceful shutdown (SIGTERM/SIGINT handlers in server.ts).
export async function disconnectDatabase(): Promise<void> {
  // TODO: call prisma.$disconnect()
}
