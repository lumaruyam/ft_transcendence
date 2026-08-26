<!-- Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members) -->
<!-- Responsible for: short design note for the project invite-link membership flow. See docs/api-spec.md for the endpoint contract and backend/prisma/schema.prisma for the ProjectInvite model. -->

# Project Invite Links

## What this is

A simple, link-based way for a project admin to let someone join a project, without an
email-invitation flow or an approval queue. Intentionally minimal, per the product
requirements for this feature:

- No email sending — the admin copies/shares the link themselves.
- No approval step — opening the link while logged in is sufficient to join.
- Just: tokenized link → membership insert → normal `project_members` role checks from then on.

## Flow

1. An admin (or the project owner, who is always also given an admin `project_members`
   row at project-creation time — see `projects.service.ts`'s `createProject`) calls
   `POST /api/v1/projects/:projectId/invites`. A random token is generated; only its
   hash is stored (`project_invites.token_hash`). The raw token is returned exactly
   once, in the response body, and embedded in a shareable URL.
2. A logged-in user opens that URL and the frontend calls
   `POST /api/v1/projects/invites/:token/join`.
3. The backend validates the token (not revoked, not expired, not exhausted), then
   inserts a real `project_members` row with the default `member` role
   (`invites.service.ts`'s `joinProjectFromInvite`). This insert — not the token — is
   what grants access from that point on.
4. All subsequent project access is gated by `project_members` role checks
   (`requireProjectRole` / `requireProjectMembership` in
   `../permissions/permissions.middleware.ts`), exactly as for any other member. The
   invite token has no further relevance after the join call succeeds.
5. An admin can revoke an invite (`DELETE /api/v1/projects/:projectId/invites/:inviteId`)
   at any time. This only stops the link from producing new joins — it never touches
   memberships already created from it.

## Explicit non-goals (for this pass)

- Email delivery of the invite link.
- Per-invitee approval/review queue.
- Role selection at invite-creation time — every join lands as `member`; role changes
  after joining go through the existing `assignRole` (`../permissions/roles.service.ts`),
  same as for any other member.

## Security TODOs (tracked, not yet implemented)

- Token is hashed at rest (`invites.service.ts`'s `hashInviteToken`); the plaintext
  token is never persisted or logged, only returned once in the creation response.
- Optional `expiresAt` / `maxUses` limits, checked in `validateInviteToken`.
- Revocation (`revokedAt`) checked the same way, without deleting the invite row (keeps
  an audit trail of past invites).
- The join endpoint needs rate limiting — it's the one route in this feature reachable
  without prior project membership, so it's the main brute-force surface.
- Idempotent-join contract (200-with-existing-membership vs. 409) is still an open
  TODO — see `invites.service.ts`'s `joinProjectFromInvite`.
- Audit logging for invite creation/revocation currently relies on the `created_by`
  column plus app logs (`revoked_at` has no matching `revoked_by` column yet); a
  dedicated audit table is a possible future addition, not built here.

## Explicitly out of scope for this note

- Frontend UI/routes for generating, sharing, or opening invite links.
- The exact HTTP status code mapping for each invite-validation failure — flagged as
  TODOs in `invites.controller.ts` and to be finalized in `docs/api-spec.md`.
