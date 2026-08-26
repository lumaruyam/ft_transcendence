<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: the GitHub management plan and working conventions — path ownership, review rules, branch naming. Extracted from docs/ft_transcendence_plan.md sections 8-9 into its own file for the TS backend pivot, since ownership paths changed from backend/internal/... to backend/src/modules/.... -->

# GitHub Workflow

Each top-level directory has a clear primary owner, matching the track split in
`docs/ft_transcendence_plan.md` section 10, so pull requests route to the right
reviewer and merge conflicts stay rare.

| Path | Primary owner | Notes |
|---|---|---|
| `backend/src/modules/auth/`, `backend/src/modules/permissions/`, `backend/src/db/`, `backend/prisma/`, `infra/`, `docker-compose.yml`, `.env.example` | Track 1 (Foundation) | Changes here affect everyone, so PRs touching these paths need a second reviewer before merge |
| `backend/src/modules/kanban/`, `frontend/src/kanban/` | Track 2 (Kanban core & real-time) | Split further between the two people on this track by backend vs. frontend/Socket.IO-client |
| `backend/src/modules/projects/` | Track 2, Person A (Kanban CRUD and UI, extended to Organization system / projects & members) | Moved here from Track 1 (2026-08-26 rebalance) since it's closest to Person A's existing project-level CRUD/UI work; includes the invite-link membership flow (`invites.*`). Role enforcement itself stays Track 1's `permissions/` — PRs adding new checks there still need Track 1 review |
| `backend/src/modules/git/` | Track 3 (Git integration) | |
| `backend/src/modules/notes/`, `backend/src/modules/attachments/`, `backend/src/modules/search/`, `backend/src/modules/notifications/`, `frontend/src/whiteboard/`, `frontend/src/notes/`, `frontend/src/shared/`, `frontend/src/legal/` | Track 4 (Whiteboard, notes, supporting modules) | |
| `backend/src/modules/publicapi/` | Track 1, with input from whoever owns the endpoints being exposed | Public API wraps existing endpoints, so it needs coordination with Tracks 2–4 as their endpoints stabilize |
| `frontend/src/api/` | Track 1 (unclaimed elsewhere — see TODO.md note) | Shared HTTP/Socket.IO client wrapper; lower-level/foundational rather than a specific product area, so it stayed with Track 1 when `backend/src/modules/projects/` moved out |
| `docs/`, root `README.md` | Shared, coordinated by whoever holds the Tech Lead role | Everyone contributes their own section; Tech Lead merges and keeps it coherent |

## Working conventions

- One feature branch per task, named by area (e.g. `kanban/drag-and-drop`,
  `git/webhook-receiver`).
- Pull requests required for merging into `main`; at least one other team member
  reviews before merge, per the project's recommended code review practice.
- Commit messages describe the actual change (not just "fix" or "update"), since the
  repository history itself is checked during evaluation for real work distribution
  across all 5 members.
- GitHub Issues (or a shared board) used to track task ownership per track,
  referenced in the README's Project Management section.

<!-- TODO: link the team's actual GitHub Issues board/labels once set up -->
