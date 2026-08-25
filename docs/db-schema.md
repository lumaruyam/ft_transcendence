<!-- Owner: Shared, coordinated by the Tech Lead -->
<!-- Responsible for: the authoritative, human-readable database schema description, matching backend/internal/db/models.go and infra/migrations/. -->

# Database Schema

This document is the human-readable counterpart to `backend/internal/db/models.go` (GORM models) and `infra/migrations/`. If this document and the actual migrations ever disagree, the migrations are the source of truth — update this file to match, not the other way around.

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `email` | string, unique | |
| `password_hash` | string | never stored or logged in plaintext |
| `password_salt` | string | |
| `name` | string | |
| `avatar` | string (URL) | nullable |
| `oauth_provider` | string | nullable — `github`, `gitlab`, or null if email/password only |
| `oauth_id` | string | nullable |
| `created_at` | timestamp | |

Baseline auth (email + hashed/salted password) is mandatory regardless of which auth modules are chosen — see plan.md section 1. OAuth fields are additive, populated only if the user links or signs up via GitHub/GitLab.

### `projects`

(referred to as "organizations" in the plan's module mapping — one table serves both concepts, since each project is its own workspace)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | string | |
| `owner_id` | uuid, FK → `users.id` | |
| `created_at` | timestamp | |

### `project_members`

Backbone of the Advanced permissions module — join table between `users` and `projects` carrying role.

| Column | Type | Notes |
|---|---|---|
| `project_id` | uuid, FK → `projects.id` | |
| `user_id` | uuid, FK → `users.id` | |
| `role` | string | e.g. `admin`, `member`, `viewer` |
| `joined_at` | timestamp | |

Primary key: composite (`project_id`, `user_id`).

### `boards`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid, FK → `projects.id` | |
| `name` | string | |
| `created_at` | timestamp | |

### `lists`

Columns within a board (e.g. "To Do", "PR Pending", "Done").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `board_id` | uuid, FK → `boards.id` | |
| `name` | string | |
| `position` | int | ordering within the board |

### `cards`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `list_id` | uuid, FK → `lists.id` | |
| `title` | string | |
| `description` | text | nullable |
| `linked_branch` | string | nullable — populated by Git integration |
| `linked_pr_url` | string | nullable |
| `status` | string | e.g. `open`, `pr_pending`, `done` |
| `assignee_id` | uuid, FK → `users.id` | nullable |
| `position` | int | ordering within the list |
| `created_at`, `updated_at` | timestamp | |

Every mutation to this table drives the Kanban real-time WebSocket broadcast — see architecture.md, "Kanban real-time flow."

### `notes`

One row per shared note/page (see plan.md section 3.3 — save-and-share, autosaved, not live-collaborative).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid, FK → `projects.id` | |
| `content_json` | jsonb | Tiptap document structure |
| `updated_by` | uuid, FK → `users.id` | |
| `updated_at` | timestamp | last autosave |

No version history table — last-save-wins per plan.md section 3.3, so only the latest state is kept.

### `attachments`

Covers both regular file uploads and exported whiteboard images alike (plan.md section 3.2) — a whiteboard export is just another attachment, not a separate table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid, FK → `projects.id` | |
| `card_id` | uuid, FK → `cards.id` | nullable — attachment may belong to a card or just the project |
| `file_url` | string | |
| `file_type` | string | mime type |
| `uploaded_by` | uuid, FK → `users.id` | |
| `uploaded_at` | timestamp | |

### `git_links`

| Column | Type | Notes |
|---|---|---|
| `card_id` | uuid, PK, FK → `cards.id` | one link per card |
| `repo_url` | string | |
| `branch_name` | string | |
| `pr_status` | string | e.g. `none`, `open`, `merged` |

### `notifications`

User-facing alerts, fired on creation/update/deletion actions per the Notification module's actual scope (plan.md section 2) — distinct from the silent Kanban WebSocket broadcast.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | recipient |
| `type` | string | e.g. `card_assigned`, `pr_opened`, `pr_merged`, `card_created` |
| `payload` | jsonb | event-specific data (card id, project id, etc.) |
| `read_at` | timestamp | nullable — null means unread |
| `created_at` | timestamp | |

### `webhook_events`

Audit log of every Git webhook received, regardless of whether processing succeeded — see architecture.md, "Git integration flow."

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `provider` | string | `github` or `gitlab` |
| `repo` | string | |
| `event_type` | string | `push`, `pull_request`, `merge` |
| `payload` | jsonb | raw webhook body |
| `processed_at` | timestamp | nullable — null means received but not yet (or failed to be) processed |

### `api_keys`

Supports the Public API module (see api-spec.md).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid, FK → `projects.id` | nullable |
| `user_id` | uuid, FK → `users.id` | nullable — a key is scoped to a project or a user, not both |
| `key_hash` | string | the key itself is never stored in plaintext, only its hash |
| `rate_limit` | int | requests allowed per window |
| `created_at` | timestamp | |

## Relations at a glance

```
users ──< project_members >── projects ──< boards ──< lists ──< cards
  │                               │                                │
  │                               ├──< notes                       ├──< attachments
  │                               ├──< attachments                 └──1 git_links
  │                               └──< api_keys
  │
  ├──< notifications
  └──< api_keys
```

<!-- TODO: replace the ASCII relation sketch above with a proper ER diagram once the schema stabilizes and GORM models in models.go are finalized -->
<!-- TODO: confirm cascade/delete behavior per relation (e.g. does deleting a project cascade-delete its boards/cards/notes, or soft-delete) once Track 1 finalizes migrations.go -->
