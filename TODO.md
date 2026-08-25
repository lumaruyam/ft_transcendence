# TODO — where to start, by track

Scaffolding only: every file below has an `Owner:` comment and a responsibility line at
the top, and every function is a signature-only stub with `TODO` comments describing
intended behavior. No logic has been implemented. Cross-check against
`ft_transcendence_plan.md` (sections 8 and 10) for the reasoning behind each assignment.

Rebalanced from the original draft: the organization system (`projects.go`, `members.go`)
moved from Track 1 to Track 2 Person A, since boards live inside projects and Person A
needs that context to build Kanban CRUD anyway. The low-level WS wrapper
(`wsClientWrapper.ts`) moved from Track 1 into Track 2 Person B's `wsClient.ts`, so all
WebSocket client logic has one owner instead of being split across two people. This
brings Track 1 down from 26 files to 21, closer in line with Track 4's 13 and Track 2's
~17 split across two people.

## Track 1 — Foundation, Auth, and API infrastructure (1 person)

- `backend/cmd/server/main.go`
- `backend/internal/auth/password.go`, `jwt.go`, `oauth.go`, `handlers.go`
- `backend/internal/permissions/roles.go`, `middleware.go`, `userCrud.go`
- `backend/internal/publicapi/apikeys.go`, `ratelimit.go`, `endpoints.go` *(week 3 per the plan's timeline — not part of the week 1 crunch)*
- `backend/internal/db/models.go`, `migrations.go`
- `backend/go.mod`
- `frontend/src/auth/loginForm.ts`, `signupForm.ts`, `oauthFlow.ts`
- `frontend/src/api/apiClient.ts`
- `frontend/package.json`
- `infra/nginx/nginx.conf`, `infra/migrations/0001_init.sql`
- `docker-compose.yml`, `.env.example`

## Track 2 — Kanban core & real-time sync (2 people)

**Person A — Kanban CRUD, UI, and organization system:**
- `backend/internal/projects/projects.go`, `members.go` *(moved here — boards live inside projects, so this naturally precedes Kanban CRUD)*
- `backend/internal/kanban/boards.go`, `lists.go`, `cards.go`, `validation.go`
- `frontend/src/kanban/boardApi.ts`, `listApi.ts`, `cardApi.ts`, `dragAndDrop.ts`, `cardDetail.ts`

**Person B — WebSocket layer:**
- `backend/internal/kanban/hub.go`, `broadcast.go`, `presence.go`
- `frontend/src/kanban/wsClient.ts`, `frontend/src/api/wsClientWrapper.ts`  *(now includes the low-level WS wrapper responsibilities, moved from Track 1)*, `presence.ts`

## Track 3 — Git integration (1 person)

- `backend/internal/git/branchLink.go`, `webhook.go`, `eventProcessor.go`, `webhookLog.go`
- Remember: the README justification for claiming this as a custom Major "Modules of choice" module (see plan.md section 10, Track 3) still needs to be written in `README.md`.

## Track 4 — Whiteboard, notes, and supporting modules (1 person)

- `backend/internal/notes/notes.go`
- `backend/internal/attachments/attachments.go`
- `backend/internal/search/search.go`
- `backend/internal/notifications/notifications.go`
- `frontend/src/whiteboard/whiteboardMount.tsx`, `exportToImage.ts`
- `frontend/src/notes/notesEditor.ts`, `notesApi.ts`
- `frontend/src/shared/designTokens.ts`, `components.ts`, `cssSetup.ts`
- `frontend/src/legal/privacyPolicy.ts`, `termsOfService.ts`

## Shared (coordinated by the Tech Lead)

- `README.md`
- `docs/architecture.md`, `docs/db-schema.md`, `docs/api-spec.md`
