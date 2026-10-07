<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: documenting the Public API endpoints (Track 1's publicapi module), required by the Public API major module. -->

# API Specification

**Path note:** implementation now lives at `backend/src/modules/publicapi/` (Fastify
routes in `publicapi.routes.ts`, API key logic in `apikeys.service.ts`, rate limiting
in `ratelimit.middleware.ts`; auth middleware in `apikey.middleware.ts`; key-management routes)
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

Requests present an API key in the **`X-API-Key`** header. `requireApiKey`
(`apikey.middleware.ts`) hashes it (SHA-256) and looks it up in `api_keys.key_hash` via
`validateApiKey` — plaintext keys are never stored. Keys look like `tk_<43 base64url chars>`.

```
curl -H "X-API-Key: tk_..." https://host/api/projects
```

A key identifies *who* and optionally *where*; it never grants access by itself:

- `api_keys.user_id` is the issuing user. Requests act as that user, and every project-scoped
  route still runs `requireRole` against `project_members` (docs/architecture.md §5), so
  demoting or removing the user cuts the key's access immediately. Keys with a null `user_id`
  are rejected (fail closed).
- `api_keys.project_id`, when set, restricts the key to that project (`403 api_key_project_mismatch`
  elsewhere). `GET /api/projects` then returns only that project.
- Minimum roles: `GET` cards = `viewer`; `POST`/`PUT`/`DELETE` cards = `member`.

In the canonical layout `GET /api/projects` shares its path with the JWT route in
`projects.routes.ts` (interim layout: that one is `GET /my-projects`). A Fastify route
constraint (`apiKeyRouteConstraint`, registered in `app.ts`) sends requests that carry an
`X-API-Key` header to the public handler and all others to the JWT handler.

Prehandler order on every route: `requireApiKey` → `rateLimitMiddleware` →
`enforceKeyProjectScope` → `requireRole`.

### Key management (JWT, project admin)

Not part of the 5 documented endpoints; ordinary JWT routes in `apikeys.routes.ts`.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects/{projectId}/api-keys` | Body `{ "rateLimit"?: 1..10000 }` (req/min, default `PUBLIC_API_RATE_LIMIT_DEFAULT`). `201 { apiKey, key }` — `key` is the plaintext, returned **once** |
| GET | `/api/projects/{projectId}/api-keys` | `200 { apiKeys: [...] }`, never includes key material |
| DELETE | `/api/projects/{projectId}/api-keys/{keyId}` | Revokes (deletes the row). `204`, or `404 api_key_not_found` |

## Request / response shapes

Errors are always `{ "error": "<code>", "details"?: [...] }`.

**Card**: `{ id, projectId, listId, title, description, status, position, linkedBranch, linkedPrUrl, createdAt, updatedAt }`
**Project**: `{ id, name, ownerId, createdAt, updatedAt }`

| Endpoint | Request | Success | Errors |
|---|---|---|---|
| `GET /api/projects` | — | `200 { projects: Project[] }` | 401 |
| `GET /api/projects/{projectId}/cards` | query: `listId?`, `status?`, `limit?` (1–100, default 50), `offset?` (default 0) | `200 { cards: Card[], total, limit, offset }` | 400, 401, 403, 429 |
| `POST /api/projects/{projectId}/cards` | `{ listId, title (≤200), description? (≤10000) }` | `201 { card }` | 400, 401, 403, 404 `list_not_found`, 429 |
| `PUT /api/projects/{projectId}/cards/{cardId}` | `{ title?, description? }`, at least one (partial update) | `200 { card }` | 400, 401, 403, 404 `card_not_found`, 429 |
| `DELETE /api/projects/{projectId}/cards/{cardId}` | — | `204` | 401, 403, 404 `card_not_found`, 429 |

Lists/cards from another project are reported as `404`, never `403`, so ids can't be probed.
Create/update/delete delegate to `kanban/card.service.ts`, so validation, Socket.IO broadcast
and notifications behave as for the frontend. `assignee` is not exposed (no column in `cards`).

## Rate limiting

`rateLimitMiddleware` runs a fixed one-minute window per API key, limit = `api_keys.rate_limit`
(requests/minute), in-process (per-instance, see docs/architecture.md §8). It is separate from
the IP-keyed global limit in `app.ts`, which also still applies.

Every key-authenticated response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and
`X-RateLimit-Reset` (epoch seconds). Over the limit:

```
429 Too Many Requests
Retry-After: 37
{ "error": "rate_limit_exceeded", "limit": 100, "retryAfter": 37 }
```

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

## Internal endpoints — attachments

Not part of the Public API module: the app's own file upload routes, called with the user's JWT.

| Method | Path | Min role | Body | Success |
|---|---|---|---|---|
| `POST` | `/api/attachments/:projectId` | member | `multipart/form-data`, one file field; optional `?cardId=` | `201 { "attachment": … }` |
| `GET` | `/api/attachments/:projectId` | viewer | — | `200 { "attachments": [ … ] }` |
| `GET` | `/api/attachments/:projectId/:id` | viewer | — | `200`, the file itself |
| `DELETE` | `/api/attachments/:projectId/:id` | member | — | `204` |

- 10 MiB per file, one file per request. nginx already allows 20 MiB on `/api/`.
- Accepted types: PNG, JPEG, GIF, WebP, PDF, plain text, Markdown, JSON, ZIP. SVG is deliberately
  excluded — it can carry scripts and would be served from our own origin.
- Files live under `/app/uploads` (the `uploads_data` volume) under a generated uuid name. The
  user's file name is stored as data in `file_name` and never used as a path.
- Downloads carry `Content-Disposition: attachment`, so the browser saves the file rather than
  rendering it.
- Errors: `400 invalid_upload` (type or size), `401 unauthenticated`, `403 insufficient_role`,
  `404 attachment_not_found`, `413 file_too_large`.