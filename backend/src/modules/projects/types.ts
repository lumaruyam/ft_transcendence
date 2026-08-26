// Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members)
// Responsible for: request/response DTO interfaces for the project invite-link flow, shared between
// invites.controller.ts and (eventually) the frontend API client.

export interface CreateInviteRequestBody {
  expiresAt?: string; // ISO 8601 timestamp, optional
  maxUses?: number; // optional cap on total joins via this link
}

export interface CreateInviteResponseBody {
  inviteId: string;
  projectId: string;
  inviteUrl: string; // TODO: shape TBD — likely `${FRONTEND_ORIGIN}/invites/{rawToken}/join`
  expiresAt: string | null;
  maxUses: number | null;
  createdAt: string;
}

export interface JoinInviteResponseBody {
  projectId: string;
  role: string; // always "member" for a fresh join per product requirement 3
  alreadyMember: boolean; // TODO: reflects the idempotent-join contract decided in invites.service.ts
  joinedAt: string;
}

export interface RevokeInviteRequestParams {
  projectId: string;
  inviteId: string;
}

export interface ProjectInviteDTO {
  id: string;
  projectId: string;
  createdBy: string;
  expiresAt: string | null;
  revokedAt: string | null;
  maxUses: number | null;
  currentUses: number;
  createdAt: string;
  // NOTE: deliberately no tokenHash or rawToken field here — any future invite-listing endpoint must never expose
  // the token or its hash after creation (see README_invites.md's security notes).
}
