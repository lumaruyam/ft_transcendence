<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: describing the overall system architecture (frontend/backend/Socket.IO hub/DB/reverse proxy) referenced in docs/ft_transcendence_plan.md sections 3-4. -->

# Architecture

**Stack pivot note (2026-08-26):** the backend moved from Go to **Node.js + TypeScript**
(Fastify, Prisma, Socket.IO). Product scope, module mapping, and track ownership are
unchanged — only the backend implementation technology and its internal file paths
changed. See `docs/ft_transcendence_plan.md` section 4 for the full stack rationale.

## Components

- **Frontend** — vanilla TypeScript (or Svelte if drag-and-drop/reactivity gets
  unwieldy in plain DOM code), talking to the backend over HTTPS (via the Nginx
  reverse proxy) for REST calls and over Socket.IO for the Kanban real-time layer.
- **Backend** — Node.js + TypeScript, built on **Fastify** for HTTP routing/plugins
  and **Socket.IO** for the WebSocket layer, both attached to the same underlying
  Node `http.Server` (see `backend/src/server.ts`). Business logic lives in
  `backend/src/modules/<domain>/`, one folder per track-owned domain (see
  `docs/github-workflow.md` for the ownership map).
- **Database** — PostgreSQL, accessed through **Prisma** (`backend/prisma/schema.prisma`
  is the schema source of truth; `backend/src/db/prisma/client.ts` exports the shared
  client). Covers the ORM minor module.
- **Reverse proxy** — Nginx (`infra/nginx/nginx.conf`), terminating TLS for all
  browser-facing traffic and proxying both plain HTTP routes and the `/socket.io/`
  WebSocket-upgrade path to the backend container.
- **Containerization** — Docker Compose (`docker-compose.yml`) with services for
  frontend, backend, Postgres, and Nginx, runnable with a single `docker compose up`.

<!-- TODO: diagram the request flow: browser -> Nginx (TLS termination) -> Fastify routes / Socket.IO -> Prisma -> Postgres -->

## Kanban real-time flow

1. A client calls a Fastify route in `backend/src/modules/kanban/` (e.g. `POST /cards`
   via `cards.service.ts`'s `createCard`).
2. The mutation is written to Postgres via Prisma.
3. `broadcast.ts` emits the resulting event to every other client in the project's
   Socket.IO room (`io.to(projectId).emit(...)`), replacing the former Go skeleton's
   hand-rolled `map[project_id]map[*Client]bool` hub with Socket.IO's built-in room
   support (`backend/src/modules/kanban/hub.ts`).
4. Presence ("joined"/"left") is broadcast the same way on Socket.IO `connection`/
   `disconnect` events (`presence.ts`).

This is silent state sync — not a user-facing notification (see the Notification
module flow below for that).

## Git integration flow

1. A user links a card to a branch (`backend/src/modules/git/branchLink.service.ts`),
   using the OAuth token captured by `backend/src/modules/auth/oauth.service.ts`.
   GitHub calls go through **Octokit**; GitLab calls go through a GitLab REST client
   (e.g. `@gitbeaker/rest`).
2. A webhook is registered on the linked repository for push/pull_request/merge
   events (`registerWebhook` in `webhook.routes.ts`).
3. On webhook receipt (`webhookReceiverHandler`): the signature is verified, the
   event is logged to `webhook_events` (`webhookLog.service.ts`), and
   `eventProcessor.service.ts` matches the payload to a card via `git_links` and
   drives the status transition (PR pending → Done), calling back into Track 2's
   `cards.service.ts` so the move also broadcasts over Socket.IO.
4. A notification fires via `notifications.service.ts` once the card moves.

<!-- TODO: expand with a sequence diagram once the webhook signature verification and OAuth token storage details are finalized -->
