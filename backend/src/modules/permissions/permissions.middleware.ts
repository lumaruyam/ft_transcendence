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

// requireProjectRole returns a preHandler that only allows callers whose project role is in the given allow-list.
// Complements requireRole's minimum-privilege-threshold check with an explicit set — used where "admin only" (not
// "admin-or-above on some ordinal scale") is the actual rule, e.g. invite creation/revocation in
// modules/projects/invites.routes.ts (owned by Track 2 Person A, who now also owns modules/projects/ — see TODO.md).
// TODO: consider consolidating with requireRole once the team settles on one role-comparison model (ordinal vs. set).
export function requireProjectRole(allowedRoles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // TODO: read project ID from request.params.projectId, caller's user ID from request context (set by requireAuth)
    // TODO: look up the caller's role via getUserRole; reply.code(403) if it's not in allowedRoles (or the caller isn't a member at all)
    // TODO: this is the enforcement point for the Organization system module's admin-only actions (invites, member
    //       removal, project settings) — coordinate with Track 2 Person A, who owns the routes calling this
  };
}

// requireProjectMembership returns a preHandler that allows any project member through, regardless of role — for
// endpoints where "is a member at all" is the only access rule (e.g. viewing a board). Enforces product requirement
// that all project access is gated by project_members, never by URL knowledge alone (see README_invites.md).
export function requireProjectMembership() {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // TODO: read project ID from request.params.projectId, caller's user ID from request context
    // TODO: look up membership via getUserRole (non-null = member); reply.code(403) if the caller has no project_members row
    // TODO: an invite token alone must never satisfy this check — only a real project_members row (created at join
    //       time by modules/projects/invites.service.ts's joinProjectFromInvite) counts
  };
}
