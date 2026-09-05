// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the invite-link membership flow — issuing/joining/revoking project invites
// (the `project_invites` table) — part of the Organization system major module, grouped with
// projects.service.ts and members.service.ts per docs/github-workflow.md.
//
// Design note: an invite link only ever proves "this token was valid at the moment it was
// redeemed." It is NOT an authorization mechanism. Joining an invite does exactly one thing
// that matters for access control: it inserts a row into `project_members` (via
// members.service.ts's addMember). Every check after that — on this project's boards, cards,
// notes, etc. — goes through permissions.middleware.ts's requireRole/getUserRole reading
// project_members, never through re-checking the invite/token. See docs/architecture.md
// "Authorization flow" and docs/api-spec.md's invite security notes for the full rationale.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { ProjectInvite } from "@prisma/client";
import type { Role } from "../permissions/roles.service.js";
import { addMember } from "./members.service.js";

// INVITE_JOIN_RATE_LIMIT is the dedicated @fastify/rate-limit policy for POST
// /api/projects/invites/:token/join, registered as this route's `config.rateLimit` override
// in registerInviteRoutes below (see app.ts for where the *global* default policy is
// registered). This endpoint is intentionally stricter than the global default because:
//   - it is unauthenticated-adjacent (any logged-in user can hit it with a guessed/leaked
//     token), so it's the most attractive target for brute-forcing/enumerating invite tokens
//   - unlike most routes it has an externally-visible side effect (project_members growth)
//     even on failed attempts if not limited, so it also doubles as abuse/DoS protection
// Keyed by IP by default (the plugin's default keyGenerator); revisit if a token-scoped key
// is needed once real traffic patterns are known.
export const INVITE_JOIN_RATE_LIMIT = {
  max: 5,
  timeWindow: "1 minute",
} as const;

export interface CreateInviteInput {
  role: Role;
  expiresAt?: Date;
  maxUses?: number;
}

// createInvite mints a new invite link for a project. Returns the plaintext token exactly
// once — only its hash is ever persisted (mirrors apikeys.service.ts's issueApiKey).
export async function createInvite(
  projectId: string,
  createdByUserId: string,
  input: CreateInviteInput
): Promise<{ invite: ProjectInvite; plaintextToken: string }> {
  // TODO: validate input.role is a known Role, input.maxUses > 0 if set, input.expiresAt in the
  //       future if set — backend half of dual validation requirement
  // TODO: verify the caller is an admin of projectId via project_members (enforced upstream by
  //       requireRole in registerInviteRoutes, re-checked here defensively)
  // TODO: generate a cryptographically random token (crypto.randomBytes(32).toString("base64url"))
  // TODO: hash the token (e.g. crypto.createHash("sha256")) — unlike password hashing, this is a
  //       high-entropy random value, so a fast hash is sufficient (no bcrypt/argon2 needed)
  // TODO: prisma.projectInvite.create({ projectId, tokenHash, role, maxUses, expiresAt, createdBy })
  // TODO: return { invite, plaintextToken } — the caller (route handler) sends plaintextToken in
  //       the response body once; it is never recoverable after this call returns
  throw new Error("not implemented");
}

// joinInvite is called when a logged-in user redeems an invite token. This is the ONLY place
// invite validity is checked; once it succeeds, the invite is irrelevant to future authorization.
export async function joinInvite(token: string, userId: string): Promise<void> {
  // TODO: hash the presented token and look up the project_invites row by tokenHash
  // TODO: reject (404/410) if no matching row
  // TODO: reject (410 Gone) if revokedAt is set
  // TODO: reject (410 Gone) if expiresAt is set and in the past
  // TODO: reject (409 Conflict) if maxUses is set and useCount >= maxUses
  // TODO: reject (409 Conflict) if the user is already a project_members row for this project
  //       (idempotent no-op or explicit conflict — team to decide)
  // TODO: in a transaction: call addMember(invite.projectId, userId, invite.role) to insert the
  //       project_members row — this is the actual membership grant — then increment useCount
  // TODO: after this point, the invite is spent; do not store/return the token again
}

// revokeInvite disables an invite link before it expires or is fully used, e.g. if it leaked.
// Does NOT touch project_members — existing members stay members; this only stops future joins.
export async function revokeInvite(
  projectId: string,
  inviteId: string,
  revokedByUserId: string
): Promise<void> {
  // TODO: verify the caller is an admin of projectId via project_members (enforced upstream)
  // TODO: prisma.projectInvite.update({ where: { id: inviteId, projectId }, data: { revokedBy:
  //       revokedByUserId, revokedAt: new Date() } }) — no-op/error if already revoked
}

// listInvites returns a project's outstanding and past invites for the members management view.
export async function listInvites(projectId: string): Promise<ProjectInvite[]> {
  // TODO: prisma.projectInvite.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } })
  // TODO: never include tokenHash in the serialized response — it's a secret, not a display field
  return [];
}

// registerInviteRoutes mounts the invite endpoints on the given Fastify instance, called from
// app.ts. All three require requireAuth (the caller must be logged in); create/revoke also
// require requireRole("admin") on :projectId since only project admins manage invites. The join
// route deliberately does NOT use requireRole — the whole point is granting access to someone
// who ISN'T a member yet — but does carry the dedicated INVITE_JOIN_RATE_LIMIT config above.
export function registerInviteRoutes(app: FastifyInstance): void {
  // TODO: app.post("/api/projects/:projectId/invites", { preHandler: [requireAuth,
  //       requireRole(ROLES.ADMIN)] }, createInviteHandler)
  // TODO: app.post("/api/projects/invites/:token/join", { preHandler: [requireAuth],
  //       config: { rateLimit: INVITE_JOIN_RATE_LIMIT } }, joinInviteHandler)
  // TODO: app.delete("/api/projects/:projectId/invites/:inviteId", { preHandler: [requireAuth,
  //       requireRole(ROLES.ADMIN)] }, revokeInviteHandler)
}

// createInviteHandler — POST /api/projects/{project_id}/invites. Admin-only (requireRole).
async function createInviteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode/validate body against CreateInviteInput, call createInvite, return 201 with
  //       { invite, token: plaintextToken } — this is the one response that ever carries the
  //       plaintext token
}

// joinInviteHandler — POST /api/projects/invites/{token}/join. Requires auth, NOT project
// membership. Rate-limited per INVITE_JOIN_RATE_LIMIT (see registerInviteRoutes).
async function joinInviteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read :token from params and the caller's userId from request context (set by
  //       requireAuth), call joinInvite, map its rejection reasons to 404/409/410, else 200/204
}

// revokeInviteHandler — DELETE /api/projects/{project_id}/invites/{invite_id}. Admin-only.
async function revokeInviteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: read :projectId/:inviteId from params and the caller's userId, call revokeInvite,
  //       return 204
}
