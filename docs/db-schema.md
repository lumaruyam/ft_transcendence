<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: the authoritative, human-readable database schema description. The schema's source of truth is backend/prisma/schema.prisma (Prisma); infra/migrations/0001_init.sql is a hand-maintained SQL baseline scaffold kept in sync until the team's first `prisma migrate dev` run generates real Prisma migrations. -->

# Database Schema

**ORM note:** the backend uses **Prisma** against PostgreSQL (covers the ORM minor
module). This replaced the earlier GORM-based Go skeleton; the table/column semantics
below are unchanged by that pivot — only the ORM implementation differs.

Prisma model names are PascalCase / camelCase (e.g. `ApiKey.rateLimit`) and mapped
back to the snake_case table/column names below via `@@map` / `@map` directives in
`backend/prisma/schema.prisma`, so the physical Postgres schema stays exactly as
documented here regardless of which ORM reads it.

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email, password_hash, password_salt, name, avatar, oauth_provider, oauth_id | Mandatory email/password baseline + OAuth minor module |
| `projects` | id, name, owner_id | Organization system major module |
| `project_members` | project_id, user_id, role | **Sole source of truth for authorization.** Backbone of the Advanced permissions module; composite primary key. Every access-control check (`requireRole`/`getUserRole`) reads this table, regardless of whether the row was created by project creation (owner) or by an invite join — see `project_invites` below |
| `project_invites` | id, project_id, token_hash (unique), role, max_uses (nullable), use_count, expires_at (nullable), created_by, created_at, revoked_by (nullable, FK `users.id`), revoked_at (nullable) | Invite-link membership flow (`backend/src/modules/projects/invites.ts`). `token_hash` stores a hash of the invite token — the plaintext is returned once at creation and never persisted. An invite **does not replace or duplicate `project_members`**: joining an invite is the *action* that inserts a `project_members` row; the invite row itself is never consulted for authorization afterwards, only for join-time validity (not expired, not revoked, under `max_uses`) |
| `boards` | id, project_id, title | One board per project in the core plan |
| `lists` | id, board_id, title, position | Kanban columns |
| `cards` | id, title, list_id, linked_branch, linked_pr_url, status, position | Core Kanban entity; `linked_branch`/`linked_pr_url`/`status` driven by the Git integration module |
| `notes` | id, project_id, content_json, updated_by, updated_at | Autosaved on edit, last-save-wins |
| `attachments` | id, project_id, card_id (nullable), file_url, file_type, uploaded_by, uploaded_at | Covers regular file uploads and exported whiteboard images alike |
| `git_links` | card_id, repo_url, branch_name, pr_status | Drives the webhook-based card status automation |
| `notifications` | id, user_id, type, payload, read_at, created_at | Fires on creation/update/deletion actions |
| `webhook_events` | id, provider, repo, event_type, payload, processed_at, created_at | Audit log of every Git webhook received |
| `api_keys` | id, project_id (nullable), user_id (nullable), key_hash, rate_limit, created_at | Supports the Public API major module |

## Relations

- `projects.owner_id -> users.id`
- `project_members.(project_id, user_id) -> projects.id, users.id` (composite key)
- `project_invites.project_id -> projects.id`, `project_invites.created_by -> users.id`,
  `project_invites.revoked_by -> users.id` (nullable — set only once an admin revokes the
  invite, alongside `revoked_at`). No FK/relation from `project_invites` to `project_members`:
  the two tables are linked only by the *action* of joining, not by a stored reference —
  `project_invites` records "was this link ever usable," `project_members` records "who is
  actually a member, with what role," and only the latter is ever read for authorization
- `boards.project_id -> projects.id`
- `lists.board_id -> boards.id`
- `cards.list_id -> lists.id`
- `notes.project_id -> projects.id`, `notes.updated_by -> users.id`
- `attachments.project_id -> projects.id`, `attachments.card_id -> cards.id` (nullable), `attachments.uploaded_by -> users.id`
- `git_links.card_id -> cards.id` (one-to-one)
- `notifications.user_id -> users.id`
- `api_keys.project_id -> projects.id` (nullable — a key may be user-scoped instead)
- `api_keys.user_id -> users.id` (Added on 03/09/2026)

<!-- TODO: include an ER diagram once the schema stabilizes -->
<!-- TODO: once `npx prisma migrate dev` has been run at least once, link to the generated migration files under backend/prisma/migrations/ as the authoritative history -->
