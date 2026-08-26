// Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members)
// Responsible for: Fastify route handlers for the project invite-link flow — generate, join, and revoke. Thin HTTP
// layer over invites.service.ts; all real logic (token validation, membership insert) lives in the service.
import type { FastifyRequest, FastifyReply } from "fastify";
import * as invitesService from "./invites.service";

// createProjectInvite handles POST /api/v1/projects/:projectId/invites — owner/admin only
// (requireAuth + requireProjectRole enforced in invites.routes.ts, not here).
export async function createProjectInvite(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read projectId from request.params, optional expiresAt/maxUses from request.body (CreateInviteRequestBody, types.ts)
  // TODO: read the authenticated caller's userId from request context (set by permissions.middleware.ts's requireAuth)
  // TODO: call invitesService.createProjectInvite({ projectId, createdBy: userId, expiresAt, maxUses })
  // TODO: return 201 with a CreateInviteResponseBody (types.ts) — build the shareable invite URL as
  //       `${FRONTEND_ORIGIN}/invites/{rawToken}/join` or similar; the frontend page for this is out of scope here
  // TODO: map invitesService validation errors to 400 per docs/api-spec.md's error format
}

// joinProjectByInvite handles POST /api/v1/projects/invites/:token/join — any authenticated user.
export async function joinProjectByInvite(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read token from request.params, userId from request context (requireAuth)
  // TODO: call invitesService.joinProjectFromInvite({ rawToken: token, userId })
  // TODO: map invitesService's typed "invalid"/"revoked"/"expired"/"exhausted" errors to 404/410/409 (team's
  //       choice — document the final mapping in docs/api-spec.md)
  // TODO: apply the idempotent-already-member contract decided in invites.service.ts's joinProjectFromInvite
  //       (reflect it via JoinInviteResponseBody.alreadyMember, types.ts)
  // TODO: return 200/201 with a JoinInviteResponseBody
  // TODO: this route needs rate limiting (see README_invites.md's security notes) — it's the main brute-force
  //       surface for this whole feature since it's reachable without prior project membership
}

// revokeProjectInvite handles DELETE /api/v1/projects/:projectId/invites/:inviteId — owner/admin only.
export async function revokeProjectInvite(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read projectId + inviteId from request.params, revokedBy from request context (requireAuth)
  // TODO: call invitesService.revokeProjectInvite({ projectId, inviteId, revokedBy })
  // TODO: return 204 — revoking never removes existing project_members rows (product requirement 5)
}
