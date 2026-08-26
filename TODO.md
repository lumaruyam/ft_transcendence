# TODO — where to start, by track

Scaffolding only: every file below has an `Owner:` comment and a responsibility line at
the top, and every function is a signature-only stub with `TODO` comments describing
intended behavior. No logic has been implemented. Cross-check against
`docs/ft_transcendence_plan.md` (sections 8 and 10) and `docs/github-workflow.md` for
the reasoning behind each assignment.

**Stack pivot (2026-08-26):** the backend is now Node.js + TypeScript (Fastify, Prisma,
Socket.IO), not Go. Every path below reflects the new `backend/src/...` layout — the
former `backend/internal/*.go` skeleton has been removed.

Two paths aren't explicitly assigned in the plan's GitHub management table
(`backend/src/modules/projects/` and `frontend/src/api/`) — they're grouped under
Track 1 here since they're foundational/unclaimed elsewhere; confirm this with the team.

## Track 1 — Foundation, Auth, and API infrastructure (1 person)

- `backend/src/server.ts`, `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/modules/auth/password.service.ts`, `jwt.service.ts`, `oauth.service.ts`, `auth.routes.ts`, `auth.validation.ts`
- `backend/src/modules/permissions/roles.service.ts`, `permissions.middleware.ts`, `users.service.ts`
- `backend/src/modules/projects/projects.service.ts`, `members.service.ts` *(organization system — unclaimed in the GH table, grouped here)*
- `backend/src/modules/publicapi/apikeys.service.ts`, `ratelimit.middleware.ts`, `publicapi.routes.ts`
- `backend/src/db/prisma/client.ts`
- `backend/prisma/schema.prisma`
- `backend/package.json`, `backend/tsconfig.json`, `backend/.eslintrc.json`, `backend/.prettierrc.json`
- `frontend/src/auth/loginForm.ts`, `signupForm.ts`, `oauthFlow.ts`
- `frontend/src/api/apiClient.ts`, `wsClientWrapper.ts` *(low-level Socket.IO client wrapper — unclaimed in the GH table, grouped here)*
- `frontend/package.json`
- `infra/nginx/nginx.conf`, `infra/migrations/0001_init.sql`
- `docker-compose.yml`, `.env.example`

## Track 2 — Kanban core & real-time sync (2 people)

**Person A — Kanban CRUD and UI:**
- `backend/src/modules/kanban/boards.service.ts`, `lists.service.ts`, `cards.service.ts`, `validation.ts`
- `frontend/src/kanban/boardApi.ts`, `listApi.ts`, `cardApi.ts`, `dragAndDrop.ts`, `cardDetail.ts`

**Person B — WebSocket layer (Socket.IO):**
- `backend/src/modules/kanban/hub.ts`, `broadcast.ts`, `presence.ts`
- `frontend/src/kanban/wsClient.ts`, `presence.ts` *(now built on `socket.io-client`, not a raw WebSocket)*

## Track 3 — Git integration (1 person)

- `backend/src/modules/git/branchLink.service.ts`, `webhook.routes.ts`, `eventProcessor.service.ts`, `webhookLog.service.ts` *(GitHub via Octokit, GitLab via a GitLab REST client such as `@gitbeaker/rest`)*
- Remember: the README justification for claiming this as a custom Major "Modules of choice" module (see `docs/ft_transcendence_plan.md` section 10, Track 3) still needs to be written in `README.md`.

## Track 4 — Whiteboard, notes, and supporting modules (1 person)

- `backend/src/modules/notes/notes.service.ts`
- `backend/src/modules/attachments/attachments.service.ts`
- `backend/src/modules/search/search.service.ts`
- `backend/src/modules/notifications/notifications.service.ts`
- `frontend/src/whiteboard/whiteboardMount.tsx`, `exportToImage.ts`
- `frontend/src/notes/notesEditor.ts`, `notesApi.ts`
- `frontend/src/shared/designTokens.ts`, `components.ts`, `cssSetup.ts`
- `frontend/src/legal/privacyPolicy.ts`, `termsOfService.ts`

## Shared (coordinated by the Tech Lead)

- `README.md`
- `docs/ft_transcendence_plan.md`, `docs/architecture.md`, `docs/db-schema.md`, `docs/api-spec.md`, `docs/github-workflow.md`
