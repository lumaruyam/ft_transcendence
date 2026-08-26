// Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members)
// Responsible for: business logic for project invite links — token generation/hashing/validation, invite
// persistence, and turning a valid invite into a real project_members row at join time. Advanced permissions
// alignment: project_members remains the sole source of truth for access; an invite token only ever grants a
// one-time membership insert at join time, never ongoing access. See README_invites.md for the full design note.
import type { ProjectInvite, ProjectMember } from "@prisma/client";
import { ROLES } from "../permissions/roles.service";

export interface CreateInviteTokenInput {
  projectId: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
}

export interface CreateInviteTokenResult {
  rawToken: string;
  tokenHash: string;
}

export interface CreateProjectInviteParams {
  projectId: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
}

export interface CreateProjectInviteResult {
  invite: ProjectInvite;
  rawToken: string; // returned exactly once to the caller — only the hash is ever persisted
}

export interface JoinProjectFromInviteParams {
  rawToken: string;
  userId: string;
}

export interface JoinProjectFromInviteResult {
  membership: ProjectMember;
  alreadyMember: boolean;
}

export interface RevokeProjectInviteParams {
  projectId: string;
  inviteId: string;
  revokedBy: string;
}

// createInviteToken generates a fresh random invite token and its hash, without persisting anything.
export function createInviteToken(input: CreateInviteTokenInput): CreateInviteTokenResult {
  // TODO: generate a cryptographically random raw token (e.g. crypto.randomBytes(32).toString("hex"))
  // TODO: hash it via hashInviteToken — the raw token is only ever returned to the caller once, never stored
  throw new Error("not implemented");
}

// hashInviteToken hashes a raw invite token for storage/lookup.
// Security: store only this hash (project_invites.token_hash), never the plaintext token.
export function hashInviteToken(rawToken: string): string {
  // TODO: use a fast, deterministic hash (e.g. SHA-256 via Node's `crypto` module) — this is a lookup key, not a
  //       password, so bcrypt/argon2's deliberate slowness is unnecessary and would make the join endpoint slow
  throw new Error("not implemented");
}

// validateInviteToken looks up an invite by its raw token's hash and checks it's still usable (not revoked/expired/exhausted).
export async function validateInviteToken(rawToken: string): Promise<ProjectInvite> {
  // TODO: hashInviteToken(rawToken), then prisma.projectInvite.findUnique({ where: { tokenHash } })
  // TODO: throw a typed "invalid" error if not found
  // TODO: throw a typed "revoked" error if revokedAt is set
  // TODO: throw a typed "expired" error if expiresAt is set and in the past
  // TODO: throw a typed "exhausted" error if maxUses is set and currentUses >= maxUses
  // TODO: invites.controller.ts maps these typed errors to the HTTP error codes documented in docs/api-spec.md
  throw new Error("not implemented");
}

// createProjectInvite generates a new invite link for a project. Callable only by an existing admin
// (enforced upstream by permissions.middleware.ts's requireProjectRole in invites.routes.ts).
export async function createProjectInvite(
  params: CreateProjectInviteParams
): Promise<CreateProjectInviteResult> {
  // TODO: call createInviteToken({ projectId: params.projectId, createdBy: params.createdBy, expiresAt: params.expiresAt, maxUses: params.maxUses })
  // TODO: prisma.projectInvite.create with projectId, tokenHash, createdBy, expiresAt, maxUses, currentUses: 0
  //       (audit logging: createdBy + createdAt on the row are the audit trail for "who created this invite")
  // TODO: return { invite, rawToken } — rawToken goes out in the API response exactly once and is never persisted or logged
  throw new Error("not implemented");
}

// joinProjectFromInvite validates a raw token and, if valid, inserts a project_members row with the default "member" role.
export async function joinProjectFromInvite(
  params: JoinProjectFromInviteParams
): Promise<JoinProjectFromInviteResult> {
  // TODO: const invite = await validateInviteToken(params.rawToken)
  // TODO: if (await isUserAlreadyMember(invite.projectId, params.userId)) — decide the idempotent contract: return
  //       the existing membership (200, alreadyMember: true) or a 409, per the contract documented in docs/api-spec.md
  // TODO: insert project_members row via prisma.projectMember.create with role: ROLES.MEMBER (default role — never
  //       elevated by an invite; role changes after joining go through the existing assignRole in roles.service.ts)
  // TODO: increment invite.currentUses (prisma.projectInvite.update), ideally in the same prisma.$transaction as the
  //       membership insert, so a race between two joiners near maxUses can't double-admit past the limit
  // TODO: rate limiting for this endpoint belongs in invites.routes.ts / a shared rate-limit preHandler, not here —
  //       this is the one route in the whole feature reachable without prior project membership
  throw new Error("not implemented");
}

// revokeProjectInvite disables an invite link without touching any membership already created from it.
export async function revokeProjectInvite(params: RevokeProjectInviteParams): Promise<void> {
  // TODO: prisma.projectInvite.update({ where: { id: params.inviteId, projectId: params.projectId }, data: { revokedAt: new Date() } })
  // TODO: audit logging: record params.revokedBy — schema.prisma currently has no revokedBy column, only revokedAt;
  //       add one (or a dedicated audit table) if the team wants a durable "who revoked it" record beyond app logs
  // TODO: this must NOT delete or otherwise affect existing project_members rows — already-joined users keep access,
  //       per product requirement 5
}

// isUserAlreadyMember checks whether a user already has a project_members row for a project, used for idempotent join behavior.
export async function isUserAlreadyMember(projectId: string, userId: string): Promise<boolean> {
  // TODO: prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }) !== null
  return false;
}
