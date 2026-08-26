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
