<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: documenting the Public API endpoints (Track 1's publicapi package), required by the Public API major module. -->

# API Specification

This document describes the externally-facing Public API required by the "Public API" major module (plan.md section 2): a secured, rate-limited, documented set of endpoints covering GET/POST/PUT/DELETE, exposed on top of the application's existing internal functionality. This is distinct from the internal frontend-to-backend API used by the app's own UI — the Public API is meant for external consumers (scripts, integrations, evaluators testing the module) authenticating with an API key rather than a user session.

Base URL: `https://<host>/api/v1`

## Authentication

All Public API requests must include an API key issued via `backend/internal/publicapi/apikeys.go`.

```
Authorization: Bearer <api_key>
```

Requests without a valid key, or with a revoked/expired key, receive `401 Unauthorized`. Keys are scoped to the project (or user) they were issued for — a key cannot access resources outside its own scope, and attempting to do so returns `403 Forbidden` rather than leaking existence via a `404`.

## Rate limiting

Enforced by `backend/internal/publicapi/ratelimit.go`. Every response includes:

```
X-RateLimit-Limit: <requests allowed per window>
X-RateLimit-Remaining: <requests left in the current window>
X-RateLimit-Reset: <unix timestamp when the window resets>
```

Exceeding the limit returns `429 Too Many Requests` with a `Retry-After` header. Exact limit values (requests per minute/hour) are set in `endpoints.go` configuration and should be documented here once finalized, rather than hardcoded in this spec.

## Endpoints

Five endpoints minimum, covering all four required methods (GET/POST/PUT/DELETE), implemented in `backend/internal/publicapi/endpoints.go` by wrapping the existing internal handlers (`kanban`, `projects`) rather than duplicating their logic.

### `GET /api/v1/projects`

Lists projects visible to the authenticated key's scope.

**Response `200`:**
```json
{
  "projects": [
    { "id": "string", "name": "string", "owner_id": "string" }
  ]
}
```

### `POST /api/v1/projects/{project_id}/cards`

Creates a new card on a board within the given project.

**Request body:**
```json
{
  "title": "string",
  "list_id": "string",
  "description": "string (optional)"
}
```

**Response `201`:** the created card object. **Response `400`** on validation failure (missing title, `list_id` not found or not in this project) — validated by the underlying `backend/internal/kanban/validation.go` logic that the internal API also uses.

### `GET /api/v1/projects/{project_id}/cards`

Lists cards within a project, with optional query params for filtering by list or status.

**Response `200`:**
```json
{
  "cards": [
    { "id": "string", "title": "string", "list_id": "string", "status": "string" }
  ]
}
```

### `PUT /api/v1/cards/{card_id}`

Updates an existing card's fields (title, description, list assignment, status).

**Request body:** any subset of updatable card fields.

**Response `200`:** the updated card object. Note: since this reuses the same mutation path as the internal Kanban UI (see architecture.md, "Kanban real-time flow"), a Public API update also triggers the normal WebSocket broadcast to anyone viewing that project's board live.

### `DELETE /api/v1/cards/{card_id}`

Deletes a card.

**Response `204`** on success, **`404`** if the card doesn't exist or isn't visible to this key's scope.

## Error format

All error responses share a consistent shape:

```json
{
  "error": {
    "code": "string (e.g. VALIDATION_ERROR, NOT_FOUND, RATE_LIMITED)",
    "message": "human-readable description"
  }
}
```

<!-- TODO: once Track 1 finalizes apikeys.go and ratelimit.go, fill in exact rate limit numbers and key scoping rules here -->
<!-- TODO: expand endpoint list if additional public-facing operations are added beyond the 5 documented above (e.g. notes, attachments) -->
