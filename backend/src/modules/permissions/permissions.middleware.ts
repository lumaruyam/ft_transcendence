// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify preHandler hooks enforcing authentication and role-based access for the Advanced permissions module. TS equivalent of backend/internal/permissions/middleware.go (Go skeleton, removed).
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "./roles.service";

// requireAuth rejects requests without a valid JWT before they reach a handler. Register as a preHandler on protected routes.
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: extract and validate the JWT via auth's validateJwt, attach the user ID to request context (e.g. request.userId)
  // TODO: reply.code(401) if missing/invalid
}

// requireRole returns a preHandler that rejects requests from users whose project role doesn't meet the minimum required role.
export function requireRole(minRole: Role) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // TODO: read project ID from request.params, look up the caller's role via getUserRole
    // TODO: compare against minRole's privilege level; reply.code(403) if insufficient
    // TODO: this is the enforcement point Track 2 Person A coordinates with for card/board permission checks
  };
}
