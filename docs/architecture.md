<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: describing the overall system architecture (frontend/backend/Socket.IO hub/DB/reverse proxy), the backend's module boundaries, and the main request/data flows (REST, invite join, authorization, WebSocket, Git webhook, rate limiting, data ownership), referenced in docs/ft_transcendence_plan.md sections 3-4. -->

# Architecture

**Stack pivot note (2026-08-26):** the backend moved from Go to **Node.js + TypeScript**
(Fastify, Prisma, Socket.IO). Product scope, module mapping, and track ownership are
unchanged — only the backend implementation technology and its internal file paths
changed. See `docs/ft_transcendence_plan.md` section 4 for the full stack rationale.

**API path note:** every backend REST route is mounted under the canonical **`/api`**
base path (not `/api/v1`) — e.g. `/api/auth/login`, `/api/projects/{id}/invites`. This
doc uses `/api/...` throughout to match `docs/api-spec.md` and the frontend's actual
calls in `frontend/src/api/` and `frontend/src/auth/`.

## 1. High-level system diagram

```
                                   HTTPS (browser-facing)
        ┌──────────┐     ┌──────────────────┐     ┌───────────────────────────┐
        │ Browser  │ ──▶ │  Nginx (reverse  │ ──▶ │        Backend            │
        │(Frontend │ ◀── │  proxy, TLS      │ ◀── │  Node.js + TypeScript     │
        │ TS/Svelte│     │  termination)    │     │  Fastify (HTTP) +         │
        │  client) │     │ infra/nginx/     │     │  Socket.IO (WebSocket),   │
        └──────────┘     │  nginx.conf      │     │  same http.Server         │
                          └──────────────────┘     │  (backend/src/server.ts) │
                                   ▲                └─────────────┬─────────────┘
                                   │ HTTP webhook                 │ Prisma (SQL)
                                   │ (push/PR/merge events)       ▼
                          ┌──────────────────┐          ┌──────────────────┐
                          │  GitHub / GitLab  │          │    PostgreSQL     │
                          │ (external, OAuth  │          │  (docker-compose  │
                          │  + webhooks)      │          │   `db` service)   │
                          └──────────────────┘          └──────────────────┘
```

- **Frontend** — vanilla TypeScript (or Svelte if drag-and-drop/reactivity gets
  unwieldy in plain DOM code). Talks to the backend over HTTPS through Nginx: plain
  REST calls via `frontend/src/api/apiClient.ts`, and the Kanban real-time layer via
  `socket.io-client` (`frontend/src/api/wsClientWrapper.ts`, `frontend/src/kanban/wsClient.ts`).
- **Backend** — Node.js + TypeScript, one process, hosting two protocols on the same
  underlying Node `http.Server` (`backend/src/server.ts`): **Fastify** for HTTP/REST
  routing and plugins, and **Socket.IO** for the WebSocket layer. Business logic lives
  in `backend/src/modules/<domain>/`, one folder per domain (see §2 below and
  `docs/github-workflow.md` for the track ownership map).
- **Database** — PostgreSQL, accessed exclusively through **Prisma**
  (`backend/prisma/schema.prisma` is the schema source of truth; `backend/src/db/prisma/client.ts`
  exports the shared client). No module talks to Postgres with raw SQL — covers the
  ORM minor module.
- **Reverse proxy** — Nginx (`infra/nginx/nginx.conf`). Terminates TLS for all
  browser-facing traffic (general requirement: anything touching a browser must be
  HTTPS) and proxies both plain HTTP routes and the `/socket.io/` WebSocket-upgrade
  path to the backend container. Container-to-container traffic (backend ↔ Postgres)
  does not need TLS.
- **External Git providers** — GitHub and GitLab are the only systems outside the
  Docker Compose network. The backend talks *out* to them (Octokit / `@gitbeaker/rest`,
  using OAuth tokens from `modules/auth/oauth.service.ts`) to link branches, and they
  talk *in* to the backend's webhook receiver (`modules/git/webhook.routes.ts`) to push
  push/PR/merge events. See §7.
- **Containerization** — Docker Compose (`docker-compose.yml`), services for frontend,
  backend, Postgres, and Nginx, runnable with a single `docker compose up`.

## 2. Backend module boundaries

Each folder under `backend/src/modules/` owns one domain end-to-end (service functions
+, where it registers its own routes, the Fastify handlers). Modules call into each
other's exported functions directly (in-process function calls, not HTTP) — there is no
internal service mesh, this is a single deployable.

| Module | Owns | Depended on by |
|---|---|---|
| `auth/` | Signup/login/logout, password hashing, JWT issuance/validation, OAuth2 (GitHub/GitLab) | Every protected route, via `permissions/` |
| `permissions/` | `requireAuth`/`requireRole` preHandlers, role definitions, `project_members` reads | Every protected route across every module |
| `projects/` | Projects (organizations) CRUD, `project_members` add/remove/list, **invite-link joins** (`invites.ts`) | `kanban/`, `notes/`, `attachments/`, `search/`, `publicapi/` (all scope data by project) |
| `kanban/` | Boards/lists/cards CRUD, the Socket.IO hub, broadcast, presence | `git/` (drives card status), `publicapi/` (wraps card CRUD) |
| `git/` | Branch linking, webhook receipt/verification, event→card-status processing, webhook audit log | Calls back into `kanban/` to move cards |
| `notes/` | Notes CRUD, autosave | `search/` (indexes note content) |
| `attachments/` | File uploads (regular + exported whiteboard images) | `search/`, `notifications/` |
| `search/` | Cross-entity search over cards/notes/attachments | — |
| `notifications/` | Notification creation/delivery on create/update/delete actions | Triggered by `kanban/`, `notes/`, `attachments/`, `git/` |
| `publicapi/` | API-key auth, per-key rate limiting, the 5 documented external REST endpoints | Wraps `projects/` and `kanban/` service functions |

`db/prisma/` (shared Prisma client) and `config/` (env loading) are cross-cutting, used
by every module above rather than owned by one domain.

## 3. Request lifecycle — a normal REST call

Example: a logged-in user fetches their projects (`GET /api/projects`, frontend-facing
JWT route, not the API-key `publicapi/` one).

1. Browser sends `GET /api/projects` with `Authorization: Bearer <jwt>` over HTTPS.
2. Nginx terminates TLS and proxies the plain HTTP request to the backend container.
3. Fastify's global plugins run first (CORS, helmet, and the global `@fastify/rate-limit`
   check — see §8; a request over the global limit gets a `429` here and never reaches
   routing).
4. The route's `preHandler` chain runs: `requireAuth` (validates the JWT via
   `auth/jwt.service.ts`'s `validateJwt`, attaches `request.userId`; `401` if
   missing/invalid) then, for project-scoped routes, `requireRole` (reads the caller's
   role from `project_members` via `permissions/roles.service.ts`'s `getUserRole`;
   `403` if insufficient — see §5).
5. The route handler runs, delegating to the owning module's service function (here,
   `projects/projects.service.ts`'s `listProjectsForUser`).
6. The service function calls Prisma, which issues SQL to Postgres and returns typed
   rows.
7. The handler serializes the result as JSON and returns it; Fastify sends the
   response back through Nginx to the browser.

No step here touches Socket.IO — that's a separate flow (§6), only entered for Kanban
mutations that need to fan out to other connected clients.

## 4. Invite flow lifecycle

Implemented in `backend/src/modules/projects/invites.ts`. Full endpoint/security
details in `docs/api-spec.md`; schema in `docs/db-schema.md`.

**Create** — `POST /api/projects/{project_id}/invites`, admin-only:
1. `requireAuth` + `requireRole("admin")` gate the route — only an existing admin
   (per `project_members`) can mint an invite.
2. `createInvite` generates a random token, hashes it, and stores a `project_invites`
   row (`token_hash`, `role` to grant, optional `expires_at`/`max_uses`, `created_by`).
3. The **plaintext** token is returned in this one response only — it is never stored
   and never retrievable again after this call.
4. The admin shares the token (as a link, e.g. `https://.../join?token=...`) out of
   band — email, Slack, whatever the frontend wraps around it.

**Join** — `POST /api/projects/invites/{token}/join`, any logged-in user:
1. `requireAuth` gates the route (caller must be logged in — deliberately *not*
   `requireRole`, since the caller is not a project member yet; that's the point).
2. This route also carries the dedicated `INVITE_JOIN_RATE_LIMIT` override (§8) instead
   of the global default, since it's the most brute-forceable/enumerable endpoint in
   the app.
3. `joinInvite` hashes the presented token and looks up `project_invites` by
   `token_hash`. It rejects if: no match, `revoked_at` is set, `expires_at` has passed,
   or `use_count >= max_uses`.
4. If valid, in one transaction: insert a `project_members` row
   (`projectId`, the joining `userId`, `role` from the invite) via
   `members.service.ts`'s `addMember`, then increment `project_invites.use_count`.
5. **This insert is the membership grant.** From this point on the invite is spent and
   is never consulted again — see §5.

**Revoke** — `DELETE /api/projects/{project_id}/invites/{invite_id}`, admin-only:
1. `requireAuth` + `requireRole("admin")`.
2. `revokeInvite` sets `revoked_by` (the admin's user id) and `revoked_at` on the
   `project_invites` row. This only stops *future* joins through that link — it does
   not touch `project_members`, so people who already joined stay members.

## 5. Authorization flow (`project_members` role checks)

This is the one rule the whole permissions model rests on:

> **`project_members` is the only table ever consulted to decide "can this user do
> this on this project."** Nothing else — not a JWT claim, not an invite token, not a
> URL parameter, not "this request came from someone who once had a valid link" — ever
> grants access on its own.

Concretely:

1. `requireAuth` (JWT) only proves *who the caller is* (`request.userId`). It proves
   identity, not permission.
2. `requireRole(minRole)` (`permissions/permissions.middleware.ts`) is what proves
   *permission*. It reads `project_id` from the route params, calls
   `roles.service.ts`'s `getUserRole(projectId, userId)` — a direct `project_members`
   lookup — and compares the stored role's privilege level against `minRole`.
   `null` (no row = not a member) always fails.
3. Every project-scoped route (Kanban, notes, attachments, search, invite
   create/revoke, member management) goes through `requireAuth` then `requireRole` in
   that order. The only intentional exception is the invite **join** route (§4), whose
   entire purpose is to grant a `project_members` row to someone who fails
   `requireRole` today.
4. Roles (`admin` / `member` / `viewer`, `roles.service.ts`) are project-scoped, not
   global — the same user can be `admin` on one project and have no row at all on
   another.

This is why invites don't shortcut anything: an invite link can only ever cause a
`project_members` insert (via §4 step 4). It cannot be presented later as a
substitute for a role check, because nothing downstream of the join checks invites at
all.

## 6. WebSocket real-time Kanban flow

1. A client calls a Fastify route in `backend/src/modules/kanban/` (e.g. `POST /api/cards`
   via `cards.service.ts`'s `createCard`), going through the same `requireAuth` +
   `requireRole` chain as any other project-scoped route (§3, §5).
2. The mutation is written to Postgres via Prisma.
3. `broadcast.ts` emits the resulting event to every other client in the project's
   Socket.IO room (`io.to(projectId).emit(...)`), replacing the former Go skeleton's
   hand-rolled `map[project_id]map[*Client]bool` hub with Socket.IO's built-in room
   support (`backend/src/modules/kanban/hub.ts`).
4. Presence ("joined"/"left") is broadcast the same way on Socket.IO `connection`/
   `disconnect` events (`presence.ts`). A client joins a project's room only after
   authenticating the socket connection (same JWT, validated once at connect time) —
   room membership on the socket side mirrors `project_members`, it isn't a separate
   permission system.
5. This is silent state sync — not a user-facing notification (see `notifications/`
   for that, triggered separately by the mutation itself, not by the broadcast).

## 7. Git webhook-to-card-status automation flow

1. A user links a card to a branch (`backend/src/modules/git/branchLink.service.ts`),
   using the OAuth token captured by `backend/src/modules/auth/oauth.service.ts`.
   GitHub calls go through **Octokit**; GitLab calls go through a GitLab REST client
   (e.g. `@gitbeaker/rest`).
2. A webhook is registered on the linked repository for push/pull_request/merge
   events (`registerWebhook` in `webhook.routes.ts`).
3. On webhook receipt (`webhookReceiverHandler`): this route is **not** JWT-authenticated
   (GitHub/GitLab aren't logged-in users) — instead its signature is verified via an
   HMAC check against `GIT_WEBHOOK_SECRET`, rejecting anything that doesn't match
   before the payload is trusted.
4. The event is logged to `webhook_events` (`webhookLog.service.ts`) for audit/replay,
   then `eventProcessor.service.ts` matches the payload to a card via `git_links` and
   drives the status transition (PR opened → "PR pending", merged to main → "Done"),
   calling back into `kanban/cards.service.ts` so the move also broadcasts over
   Socket.IO exactly like a user-driven move would (§6) — clients don't need to know
   the difference.
5. A notification fires via `notifications.service.ts` once the card moves.

## 8. Rate limiting strategy

**Chosen strategy: `@fastify/rate-limit`**, registered once in `backend/src/app.ts`,
standardized across the whole backend rather than a hand-rolled per-module counter
(the earlier sketch in `publicapi/ratelimit.middleware.ts` is superseded by this — see
that file's own TODO acknowledging the plugin as the preferred path).

- **Global default** — registered as a plugin before routes, configured from
  `config/env.ts`'s `rateLimit.globalMax` / `rateLimit.globalWindowMs`
  (`RATE_LIMIT_GLOBAL_MAX` / `RATE_LIMIT_GLOBAL_WINDOW_MS` in `.env`). Applies to every
  route that doesn't declare its own override. Keyed by IP by default.
- **Per-route override — invite join.** `POST /api/projects/invites/{token}/join`
  declares its own stricter policy, `INVITE_JOIN_RATE_LIMIT` in
  `modules/projects/invites.ts` (5 requests/minute, keyed by IP), passed as that
  route's `config: { rateLimit: {...} }` — `@fastify/rate-limit`'s supported way to
  override the global default per-route. This route gets its own budget because a
  successful guess has a real side effect (project membership), making it the
  highest-value target for brute-forcing/enumerating tokens in the whole app; see
  `docs/api-spec.md`'s invite security notes.
- **Public API keys** — `publicapi/`'s per-API-key limits (`api_keys.rate_limit`
  column) are a separate, coarser concept: a *quota per issued key* for external
  integrators, not a per-route abuse guard. They can be layered on top of the same
  `@fastify/rate-limit` plugin (custom `keyGenerator` returning the API key ID) or kept
  as their own counter — either is fine, but they answer a different question
  ("how much has this integration used this month") than the global/invite-join limits
  above ("is this IP hammering us right now").
- **Multi-instance note.** `@fastify/rate-limit`'s default store is in-memory per
  process. Running more than one backend instance behind Nginx gives each instance its
  own independent counter, effectively multiplying every configured limit by instance
  count. This is fine for this project's single-instance `docker-compose` deployment.
  If the team ever scales to multiple backend instances, switch to the plugin's shared
  `redis` store (e.g. via `ioredis`) so all instances enforce one shared counter — not
  needed now, called out here so it isn't a surprise later.

## 9. Data ownership / source of truth

What table is authoritative for what, so no module reaches for a shortcut that
duplicates or bypasses another table's job:

| Question | Authoritative table | Notes |
|---|---|---|
| "Is this user allowed to do X on this project?" | `project_members` | The *only* table ever read for authorization (§5). Role is project-scoped. |
| "Who owns this project?" | `projects.owner_id` | Distinct from admin `project_members` rows — ownership is a single pointer, admin membership can be shared |
| "Was this invite link ever valid, and is it still?" | `project_invites` | Join-time validity only (expiry/revocation/max-use). Never read for post-join authorization — see §5 |
| "What actually happened as a result of an invite?" | `project_members` | The row inserted by `joinInvite` — the invite itself is not a membership record |
| "What's the current state of a board/list/card?" | `boards` / `lists` / `cards` | Socket.IO broadcasts are a *notification* of a change, never the source of the change itself — always DB-write-then-broadcast, never the reverse |
| "Is a card linked to a branch, and what's its PR state?" | `git_links` | Drives, but does not itself perform, the `cards.status` transition |
| "Did we receive and process this webhook event?" | `webhook_events` | Audit/replay log; `git_links`/`cards.status` are the derived effect, not this table |
| "Is this API key valid, and what's its quota?" | `api_keys` | `key_hash` only, like `project_invites.token_hash` — never plaintext at rest |
| "Has this user seen this notification?" | `notifications.read_at` | Notifications are informational records, not an authorization or state-sync mechanism (that's Socket.IO, §6) |

<!-- TODO: expand §7 with a sequence diagram once webhook signature verification and OAuth token storage details are finalized -->
