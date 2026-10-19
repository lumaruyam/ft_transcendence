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

## Internal endpoints — whiteboard

Not part of the Public API module (no API key, no rate-limit tier): these are the app's own routes,
called by `frontend/src/whiteboard/` with the user's JWT.

| Method | Path | Min role | Body | Success |
|---|---|---|---|---|
| `GET` | `/api/whiteboards/:projectId` | viewer | — | `200 { "whiteboard": … \| null }` |
| `PUT` | `/api/whiteboards/:projectId` | member | `{ "sceneJson": { … } }` | `200 { "whiteboard": … }` |

- The whiteboard object is `{ id, projectId, sceneJson, updatedBy, updatedAt }`. `GET` returns
  `{ "whiteboard": null }` when nothing has been saved for the project yet — that is not an error.
- `PUT` replaces the whole scene (last save wins) and accepts a body up to **5 MiB**, since an
  Excalidraw scene with many shapes passes Fastify's 1 MiB default. nginx's `client_max_body_size`
  has to allow the same.
- Errors: `400 invalid_input` (`sceneJson` is not a JSON object), `401 unauthenticated`,
  and whatever `requireRole` answers when the caller's role is too low.

## Internal endpoints — kanban tags

Not part of the Public API module either: JWT routes called by `frontend/src/kanban/`, implemented in
`backend/src/modules/kanban/tag.service.ts` and `kanban.routes.ts`. Tags belong to one project: two
projects can both have a "Bug" tag with their own colour. Each new project starts with 5 default tags
(WIP, En cours, À relire, Bloqué, Bug).

| Method | Path | Min role | Body | Success |
|---|---|---|---|---|
| `GET` | `/api/projects/:projectId/tags` | viewer | — | `200 [ Tag ]` |
| `POST` | `/api/projects/:projectId/tags` | member | `{ "name", "color"? }` | `201 Tag` |
| `PUT` | `/api/tags/:id` | member | `{ "name"?, "color"? }`, at least one | `200 Tag` |
| `DELETE` | `/api/tags/:id` | member | — | `204` |
| `PUT` | `/api/cards/:id/tags` | member | `{ "tagIds": [uuid, …] }` | `200 Card` (with `tags`) |

- A `Tag` is `{ id, projectId, name, color, createdAt }`. `name` is 1 to 30 characters with at least one
  non-space character, unique per project. `color` is a `#rrggbb` string (default `#6b7280`).
- Every card sent by the board and card routes now has a `tags` array (`Tag[]`, sorted by name).
- `PUT /api/cards/:id/tags` replaces all the tags of the card (an empty array removes them all).
  It accepts up to 50 ids.
- Deleting a tag removes it from every card.
- Errors: `400` (validation, or `invalid_tags` when a tag does not exist or belongs to another
  project), `401`, `403 insufficient_role`, `404` (tag or card not found), `409 tag_name_taken`.
- Socket.IO events sent to the project room: `tag_created` and `tag_updated` (the `Tag`),
  `tag_deleted` (`{ id }`), and `card_updated` (the `Card`) when the tags of a card change.

## Internal endpoints — Git integration

Not part of the Public API module: JWT routes called by the kanban UI (`GitLinkModal.svelte`), in
`backend/src/modules/git/git.routes.ts`. The receiver GitHub calls is described below the table.

| Method | Path | Min role | Body / query | Success |
|---|---|---|---|---|
| `GET` | `/api/git/status` | any user | — | `200 { "connected": boolean }` (GitHub account linked) |
| `GET` | `/api/projects/:projectId/git/branches` | member | `?repoUrl=` | `200 { "branches": [string] }` |
| `POST` | `/api/cards/:id/git` | member | `{ "repoUrl", "branchName", "createBranch"? }` | `200 Card` |
| `DELETE` | `/api/cards/:id/git` | member | — | `200 Card` |
| `GET` | `/api/projects/:projectId/git/events` | admin | `?limit=` (1 to 200, default 50) | `200 { "events": [ { id, provider, repo, eventType, processedAt, createdAt } ] }` |

- `POST /api/cards/:id/git` links the card to a branch (creating it from the default branch when
  `createBranch` is true, which needs a linked GitHub account). It then tries to register the repository
  webhook (see below); a failure there is logged and does not fail the link.
- `GET .../git/events` is the audit log of `webhook_events` for the repositories linked in the project, newest
  first, without the payload. `processedAt` is `null` when the event was received but not handled.
- Errors: `400 invalid_input`, `401`, `403 insufficient_role`, `409 github_not_linked`, `502 github_error`.

### Webhook receiver (called by GitHub)

`POST /api/webhooks/git`, no JWT: the `X-Hub-Signature-256` HMAC (SHA-256 of the raw body with
`GIT_WEBHOOK_SECRET`) is verified first, `401` otherwise. Every valid delivery is stored in `webhook_events`
and stamped `processed_at` once handled. A card is matched only through its `git_links` row (repo + branch).

| GitHub event | Effect on the linked card |
|---|---|
| `push` to the branch | `todo` becomes `In progress` (a later push never moves a card back from `PR pending` or `Done`); tags and branch deletions are ignored |
| `pull_request` opened / reopened | `PR pending`, PR url stored, `git_links.pr_status = open`, notification to every project member |
| `pull_request` closed, merged into the default branch | `Done`, `pr_status = merged`, notification |
| `pull_request` closed, merged into another branch | ignored |
| `pull_request` closed without merge | `PR pending` goes back to `In progress`, `pr_status = closed`, notification |

The change is broadcast to the open boards (`card_updated`). A processing error answers `500` and leaves the
event unprocessed, so it can be redelivered from GitHub. Setting `WEBHOOK_PUBLIC_URL` (public https origin of
the app) lets the backend register this webhook on the repository when a branch is linked; without it, add it
by hand in the repository settings (payload URL `<origin>/api/webhooks/git`, content type `application/json`,
the same secret, events `push` and `pull requests`).

## Internal endpoints — folders, notes and files

Not part of the Public API module: the app's own routes, called with the user's JWT. Only files have folders; notes are a flat list.

**Folders** — `/api/folders`

| Method | Path | Min role | Body | Success |
|---|---|---|---|---|
| `GET` | `/api/folders/:projectId` | viewer | — | `200 { folders: […], limits: { maxSubfolders, maxDepth } }` (flat list, build the tree from `parentId`) |
| `POST` | `/api/folders/:projectId` | member | `{ name, parentId? }` | `201 { folder }` |
| `PATCH` | `/api/folders/:projectId/:id` | member | `{ name?, parentId? }` (`parentId: null` = top level) | `200 { folder }` |
| `DELETE` | `/api/folders/:projectId/:id` | member | — | `204` |
| `POST` | `/api/folders/:projectId/:id/copy` | member | `{ parentId? }` | `201 { folder }` — copies the folder with its subfolders and files (new files on disk); a copy next to the original is named "… (copie)" |

- Limits: 60 subfolders per folder (top level included) and 8 levels. Errors: `409 max_subfolders_reached`,
  `409 max_depth_reached`, `409 folder_cycle` (moving a folder into itself), `409 folder_not_empty` (only an
  empty folder can be deleted), `400 invalid_name`, `404 folder_not_found`.

**Notes** — `/api/notes`

| Method | Path | Min role | Body | Success |
|---|---|---|---|---|
| `GET` | `/api/notes/:projectId?cardId=` | viewer | — | `200 { notes: […] }` — metadata, `cardIds` and a `preview` (first 400 characters of the text), no full content; `cardId` keeps the notes linked to that card |
| `POST` | `/api/notes/:projectId` | member | `{ title? }` | `201 { note }` |
| `GET` | `/api/notes/:projectId/:noteId` | viewer | — | `200 { note }` (with `contentJson`, a read-only copy) |
| `PATCH` | `/api/notes/:projectId/:noteId` | member | `{ title? }` | `200 { note }` |
| `DELETE` | `/api/notes/:projectId/:noteId` | member | — | `204` (whoever has it open gets `note_deleted`) |
| `PUT` / `DELETE` | `/api/notes/:projectId/:noteId/cards/:cardId` | member | — | `204` — link / unlink a card of the same project |

- A project has any number of notes. The content is not written through HTTP: it is edited live
  (see below). `contentJson` is Tiptap's document JSON, derived by the server from the live Yjs document
  each time it is saved; `search.service.ts` walks it with `extractPlainText` to index the text.
- Errors: `400 invalid_title`, `404 note_not_found` / `card_not_found`, `401 unauthenticated`, `403 insufficient_role`.

**Files** — `/api/attachments` (see the file upload module) also accepts, on top of upload / list / download / delete:
`POST …?folderId=&cardId=` (put the new file in a folder and/or link it to a card), `GET …?cardId=` (files linked to a card),
`PATCH /:projectId/:id { folderId }` (move; `null` = top level), `POST /:projectId/:id/copy { folderId? }` (duplicate, with a new file on disk) and `PUT` / `DELETE /:projectId/:id/cards/:cardId` (link / unlink).
Files are returned with `folderId` and `cardIds`.

### Live editing (Socket.IO)

Each note is a Yjs document relayed over the same Socket.IO connection as the Kanban (same JWT handshake).
Binary fields are Yjs updates. The server keeps the document in memory while someone is editing it and
saves it (`notes.yjs_state` + `notes.content_json`) at most every 2 seconds, and when the last editor leaves.

| Event | Direction | Payload |
|---|---|---|
| `note_join` | client → server | `{ noteId, stateVector }` — any role, must be a member |
| `note_sync` | server → client | `{ noteId, update, stateVector, canEdit }` — answer to `note_join`; `canEdit` is false for viewers |
| `note_update` | both | `{ noteId, update }` — one edit; the server ignores it from viewers and relays it to the others |
| `note_denied` | server → client | `{ noteId }` — not a member (anymore), or the note does not exist |
| `note_awareness` | both | `{ noteId, clientId, update }` — Yjs awareness (name, colour, cursor) of one editor, viewers included; relayed only, never saved. Replayed to people who join later |
| `note_awareness_remove` | server → client | `{ noteId, clientId }` — that editor left, remove its cursor |
| `note_deleted` | server → client | `{ noteId }` — the note was deleted while open |
| `note_leave` | client → server | `noteId` |

The project room (same as the Kanban events) also receives `documents_changed` (`{}`) whenever the notes/files linked to cards change
(link, unlink, deletion, upload with `?cardId=`): the board reloads how many documents each card has.

The role is re-read from the database every 30 seconds, so a removal or demotion takes effect quickly.
