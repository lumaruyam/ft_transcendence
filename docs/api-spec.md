<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: documenting the Public API endpoints (Track 1's publicapi module), required by the Public API major module. -->

# API Specification

**Path note:** implementation now lives at `backend/src/modules/publicapi/` (Fastify
routes in `publicapi.routes.ts`, API key logic in `apikeys.service.ts`, rate limiting
in `ratelimit.middleware.ts`) — this replaced the former Go path
`backend/internal/publicapi/`. The endpoint contract, auth model, and rate-limit
behavior described below are unchanged by the pivot.

## Endpoints (5 documented, per the Public API major module requirement)

| Method | Path | Handler |
|---|---|---|
| GET | `/api/projects` | `getProjectsHandler` |
| GET | `/api/projects/{projectId}/cards` | `getCardsHandler` |
| POST | `/api/projects/{projectId}/cards` | `createCardHandler` |
| PUT | `/api/projects/{projectId}/cards/{cardId}` | `updateCardHandler` |
| DELETE | `/api/projects/{projectId}/cards/{cardId}` | `deleteCardHandler` |

All five are registered in `backend/src/modules/publicapi/publicapi.routes.ts` and
wrap the same underlying Track 2 Kanban / Track 1 Projects service functions used by
the authenticated (JWT) frontend routes — the public API is a secured, rate-limited
window onto the same data, not a separate implementation.

## Auth

Requests must present a valid API key (issued via `apikeys.service.ts`'s
`issueApiKey`, scoped to a project). The key is presented as a header (exact header
name TBD by the team, e.g. `X-API-Key`) and validated by `validateApiKey`, which
looks up the key's hash — plaintext keys are never stored.

## Rate limiting

Enforced by `ratelimit.middleware.ts`'s `rateLimitMiddleware`, registered as a Fastify
`preHandler` ahead of every `/api/*` route, checking/incrementing usage against the
key's `rate_limit` column (`checkRateLimit`). The team may implement the counter
in-process or swap in the `@fastify/rate-limit` plugin — either satisfies the module
requirement as long as it's per-key.

<!-- TODO: document exact request/response JSON shapes once the handlers are implemented -->
<!-- TODO: document rate-limit response headers/behavior (e.g. 429 body shape, Retry-After) -->

## Error format (baseline)

No error shape was previously pinned down for this doc, so this section establishes
one baseline for all endpoints — existing and new — to converge on:

```json
{
  "error": {
    "code": "string_error_code",
    "message": "human-readable message"
  }
}
```

<!-- TODO: Track 1 to confirm/finalize this shape once the first real handler ships; retrofit the Public API
     endpoints above to reference it explicitly once confirmed -->

## Project Invite Links (Organization system — Advanced permissions alignment)

**Path note:** implementation lives at `backend/src/modules/projects/` — routes in
`invites.routes.ts`, handlers in `invites.controller.ts`, logic in `invites.service.ts`,
DTOs in `types.ts`. Owned by **Track 2 Person A**, reassigned from Track 1 alongside
the rest of `projects/` (see `TODO.md` and `docs/github-workflow.md`). Full design note:
`backend/src/modules/projects/README_invites.md`.

**Versioning note:** these three endpoints use an explicit `/api/v1/` prefix, unlike
the currently-unversioned Public API endpoints documented above (`/api/projects`,
`/api/projects/{id}/cards`). This is a deliberate scaffold-level inconsistency, not yet
resolved — see the TODO in `invites.routes.ts`. Track 1 + Tech Lead should decide
whether the whole API adopts `/api/v1/` or invites drop the prefix to match.

| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/api/v1/projects/:projectId/invites` | JWT + project role `admin` | `createProjectInvite` |
| POST | `/api/v1/projects/invites/:token/join` | JWT only (no project role — see note below) | `joinProjectByInvite` |
| DELETE | `/api/v1/projects/:projectId/invites/:inviteId` | JWT + project role `admin` | `revokeProjectInvite` |

**Advanced permissions alignment (per product requirement 4):** every protected
project endpoint — these three included — must check `project_members` role via
`requireProjectRole` / `requireProjectMembership`
(`backend/src/modules/permissions/permissions.middleware.ts`), never rely on
possession of a URL as a substitute. The one deliberate exception is the join
endpoint itself: a caller isn't a member yet when they call it, so it only requires
`requireAuth` (a valid logged-in user) — the invite token is what's being checked
there, not a project role. **The invite token never grants ongoing access** — once
`joinProjectFromInvite` succeeds, the resulting `project_members` row is what's
checked on every later request, exactly like any other member; the token is not
consulted again.

### POST /api/v1/projects/:projectId/invites

Request body (`CreateInviteRequestBody`):
```json
{ "expiresAt": "2026-09-01T00:00:00Z", "maxUses": 10 }
```
Both fields optional. Response (`CreateInviteResponseBody`, 201): invite id, project
id, a shareable `inviteUrl` embedding the one-time raw token, expiry/max-use echo, and
`createdAt`. <!-- TODO: pin down inviteUrl's exact shape once the frontend invite page route exists -->

### POST /api/v1/projects/invites/:token/join

No body. Response (`JoinInviteResponseBody`, 200/201): `projectId`, `role` (always
`"member"`), `alreadyMember` (idempotency flag), `joinedAt`.
<!-- TODO: pin down whether an already-member caller gets 200 + alreadyMember:true, or 409 — see invites.service.ts's joinProjectFromInvite -->
<!-- TODO: pin down status codes for invalid/revoked/expired/exhausted tokens (404 vs 410 vs 409 — team's choice) -->

### DELETE /api/v1/projects/:projectId/invites/:inviteId

No body. 204 on success. Does **not** remove any `project_members` rows already
created from this invite (product requirement 5).

### Security TODOs (see README_invites.md for the full list)

- Invite token stored only as a hash (`project_invites.token_hash`); plaintext never persisted or logged.
- Optional `expiresAt` / `maxUses`, enforced in `validateInviteToken`.
- Revocation checked without deleting the invite row (audit trail).
- `POST .../invites/:token/join` needs rate limiting — the one route here reachable without prior project membership.
- Audit fields: `created_by` exists on `project_invites`; a matching `revoked_by` column is a TODO, not yet added.
