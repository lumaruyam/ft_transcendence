<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: describing the overall system architecture (frontend/backend/WS hub/DB/reverse proxy) referenced in plan.md sections 3-4. -->

# Architecture

## System overview

The application is split into four containers, orchestrated by Docker Compose and running behind a single reverse proxy:

- **Frontend** — a vanilla TypeScript (or Svelte, where component structure is worth the extra weight) single-page app, built and served as static assets. One route (the whiteboard page) mounts an isolated React tree to host the `@excalidraw/excalidraw` component; the rest of the app is not React.
- **Backend** — a single Go binary (`backend/cmd/server`) that serves the REST API and hosts the WebSocket hub in the same process. There is no separate WebSocket service — `gorilla/websocket` connections are handled by the same Go server that answers HTTP requests, sharing the same in-memory state (e.g. the per-project room map) without needing cross-process coordination.
- **PostgreSQL** — the single source of truth for all persisted data (users, projects, boards/lists/cards, notes, attachments metadata, Git links, webhook events, notifications). Accessed through GORM.
- **Nginx (reverse proxy)** — terminates HTTPS for all browser-facing traffic and routes requests to the frontend static assets or the Go backend. Internal traffic between the backend and Postgres does not require encryption, per the project's general requirements.

```
Browser
  │  HTTPS
  ▼
Nginx (reverse proxy, TLS termination)
  │
  ├── static assets ──────────────► Frontend (TS/Svelte + isolated React/Excalidraw route)
  │
  └── /api, /ws ───────────────────► Go backend
                                        ├── REST handlers (auth, kanban, notes, attachments,
                                        │   search, notifications, git, publicapi, permissions)
                                        ├── WebSocket hub (Kanban real-time only)
                                        └── GORM ──────────► PostgreSQL
```

External integration: the Go backend also makes outbound calls to the GitHub/GitLab API (via `go-github`), and receives inbound webhook calls from GitHub/GitLab on a dedicated endpoint under `backend/internal/git/`.

## Where each pillar lives

- **Kanban** — the only real-time pillar. CRUD lives in `backend/internal/kanban/` (`boards.go`, `lists.go`, `cards.go`), the WebSocket hub lives alongside it (`hub.go`, `broadcast.go`, `presence.go`). Frontend counterparts live in `frontend/src/kanban/`.
- **Whiteboard** — save-and-share, not live. No backend "canvas" logic exists; a finished drawing is exported to an image client-side (`frontend/src/whiteboard/exportToImage.ts`) and uploaded through the same attachments pipeline as any other file (`backend/internal/attachments/`).
- **Notes** — save-and-share, not live. Content is stored as JSON (`backend/internal/notes/notes.go`), loaded on open, and autosaved from the frontend editor (`frontend/src/notes/`) via plain HTTP requests — no WebSocket involvement.
- **Git integration** — `backend/internal/git/` handles both directions: outbound calls to link/create branches, and inbound webhook events that drive card status transitions.

## Kanban real-time flow

1. A user performs a mutation in the UI (create, edit, move, or delete a card).
2. The frontend sends a normal HTTP request to the relevant Kanban endpoint (`backend/internal/kanban/`).
3. The backend validates the request, applies permission checks (`backend/internal/permissions/middleware.go`), and writes the change to PostgreSQL via GORM.
4. Once the write succeeds, the backend hands the resulting event to the WebSocket hub (`hub.go`), which looks up every client currently connected to that project's room.
5. The hub broadcasts a small JSON message (e.g. `{type: "card_moved", card_id, new_list_id, new_position}`) to every other connected client in that room. The originating client does not need this broadcast — it already updated its own UI optimistically or from the HTTP response.
6. Each receiving client's WebSocket handler (`frontend/src/kanban/wsClient.ts`, built on the shared connection wrapper in `wsConnection.ts`) applies the event to local board state directly, without a full re-fetch.
7. Presence follows the same hub mechanism: on connect/disconnect, the hub broadcasts a join/leave event to the room, and clients render this as online indicators.
8. On reconnect after a dropped connection, the client re-fetches current board state rather than assuming the socket resumed cleanly — this avoids a client silently drifting out of sync after a brief network interruption.

This broadcast is silent state sync, not a user-facing notification — nobody sees an alert when a card moves, they just see it move. The separate Notification system (`backend/internal/notifications/`) is what generates actual user-facing alerts, and only for creation/update/deletion actions as a distinct concern from this real-time sync.

## Git integration flow

1. A user links a Kanban card to a Git branch. The frontend calls into `backend/internal/git/branchLink.go`, which uses the OAuth token obtained during login (`backend/internal/auth/oauth.go`) to either create a new branch via the GitHub/GitLab API or link an existing one.
2. As part of linking, the backend registers a webhook on the target repository for push, pull_request, and merge events.
3. When an event occurs on GitHub/GitLab, it calls the backend's webhook receiver endpoint (`backend/internal/git/webhook.go`).
4. The receiver logs the raw event to `webhook_events` (`webhookLog.go`) before processing, so every event is auditable even if downstream processing fails.
5. `eventProcessor.go` matches the incoming payload to the correct card via the `git_links` table, and determines the status transition:
   - PR opened → card moves to "PR pending"
   - Merged to main → card moves to "Done"
6. The status transition is applied through the same Kanban update path used by manual edits (`backend/internal/kanban/cards.go`), so it also triggers the normal Kanban real-time broadcast described above — everyone viewing the board sees the card move live, the same as if a teammate had dragged it.
7. The event processor also triggers a notification (`backend/internal/notifications/`) to the card's assignee, since a PR opening or merging is exactly the kind of meaningful event the notification system is meant to surface.

This flow is why Git integration and Kanban's real-time layer are not independent of each other in practice: Git integration reuses Kanban's existing mutation path rather than writing to the board separately, which keeps there being only one way a card's state ever changes.
