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

## Invite-link membership endpoints

Implemented in `backend/src/modules/projects/invites.ts` (both the service functions and
the Fastify route handlers live in that one file, same pattern as `auth.routes.ts` and
`webhook.routes.ts`). These are ordinary JWT-authenticated routes (same auth as the
frontend's other `/api/*` calls), not part of the API-key-based Public API section above.

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/projects/{project_id}/invites` | `createInviteHandler` | JWT + project admin (`requireRole("admin")`) |
| POST | `/api/projects/invites/{token}/join` | `joinInviteHandler` | JWT only — caller need **not** be a project member yet |
| DELETE | `/api/projects/{project_id}/invites/{invite_id}` | `revokeInviteHandler` | JWT + project admin (`requireRole("admin")`) |

### Security notes

- **Token stored hashed.** `createInvite` returns the plaintext token to the caller exactly
  once, in the create response body; only its hash (`project_invites.token_hash`) is ever
  persisted. The join endpoint hashes the presented `{token}` path param and looks up that
  hash — a leaked database dump never yields a usable invite token.
- **Expiry / revocation / max-use checks happen only at join time.** `joinInvite` rejects if
  `revoked_at` is set, if `expires_at` is in the past, or if `use_count >= max_uses` (when
  `max_uses` is set). These are the only validity checks an invite ever gets — see
  `db-schema.md` for the `revoked_by`/`revoked_at` columns.
- **Dedicated join rate limit.** `POST /api/projects/invites/{token}/join` carries its own
  `@fastify/rate-limit` policy (`INVITE_JOIN_RATE_LIMIT` in `invites.ts`: 5 requests/minute,
  keyed by IP), stricter than and independent of the global default described in
  `docs/architecture.md` "Rate limiting strategy". This endpoint is the most attractive target
  for brute-forcing/enumerating invite tokens, since a valid guess has a real side effect
  (project membership), so it gets its own tighter budget rather than sharing the global one.
- **Post-join authorization always goes through `project_members`, never the invite.** Once
  `joinInvite` inserts the `project_members` row (via `members.service.ts`'s `addMember`), the
  invite is spent and irrelevant. Every subsequent request to this project's resources is
  authorized by `permissions.middleware.ts` reading `project_members` (role-based), not by
  presenting the invite token again or by any other form of "possessing the link." An invite
  link is a one-time credential for *joining*, never a standing credential for *access*.
