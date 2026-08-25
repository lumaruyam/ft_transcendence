// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: GORM model definitions for every table in the schema (users, projects,
// project_members, boards, lists, cards, notes, attachments, git_links, notifications,
// webhook_events, api_keys).

package db

import (
	"time"

	"github.com/google/uuid"
)

// User maps to the `users` table: id, email, password_hash, password_salt, name, avatar,
// oauth_provider, oauth_id.
type User struct {
	ID            uuid.UUID
	Email         string
	PasswordHash  string
	PasswordSalt  string
	Name          string
	Avatar        string
	OAuthProvider string
	OAuthID       string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Project maps to the `organizations`/`projects` table: id, name, owner_id.
type Project struct {
	ID        uuid.UUID
	Name      string
	OwnerID   uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ProjectMember maps to `project_members` — the backbone of the Advanced permissions module.
type ProjectMember struct {
	ProjectID uuid.UUID
	UserID    uuid.UUID
	Role      string
	JoinedAt  time.Time
}

// Board maps to `boards`.
type Board struct {
	ID        uuid.UUID
	ProjectID uuid.UUID
	Name      string
	CreatedAt time.Time
}

// List maps to `lists`.
type List struct {
	ID       uuid.UUID
	BoardID  uuid.UUID
	Name     string
	Position int
}

// Card maps to `cards`: id, title, list_id, linked_branch, linked_pr_url, status,
// assignee_id, position. AssigneeID is required by the plan's card detail view (title,
// description, assignee) and by Track 4's "card assigned to you" notification.
type Card struct {
	ID           uuid.UUID
	Title        string
	Description  string
	ListID       uuid.UUID
	LinkedBranch string
	LinkedPRURL  string
	Status       string
	AssigneeID   *uuid.UUID
	Position     int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Note maps to `notes`: id, project_id, content_json, updated_by, updated_at. Autosaved on
// edit per Track 4's notes module.
type Note struct {
	ID          uuid.UUID
	ProjectID   uuid.UUID
	ContentJSON string
	UpdatedBy   uuid.UUID
	UpdatedAt   time.Time
}

// Attachment maps to `attachments` — covers regular file uploads and exported whiteboard
// images alike.
type Attachment struct {
	ID         uuid.UUID
	ProjectID  uuid.UUID
	CardID     *uuid.UUID
	FileURL    string
	FileType   string
	UploadedBy uuid.UUID
	UploadedAt time.Time
}

// GitLink maps to `git_links`: card_id, repo_url, branch_name, pr_status — drives Track 3's
// card status automation.
type GitLink struct {
	CardID     uuid.UUID
	RepoURL    string
	BranchName string
	PRStatus   string
}

// Notification maps to `notifications` — fires on creation/update/deletion actions per
// Track 4's notification module.
type Notification struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Type      string
	Payload   string
	ReadAt    *time.Time
	CreatedAt time.Time
}

// WebhookEvent maps to `webhook_events` — audit log of every Git webhook received, owned by
// Track 3. CreatedAt (received) is kept separate from ProcessedAt so a received-but-not-yet-
// processed event is distinguishable during debugging.
type WebhookEvent struct {
	ID          uuid.UUID
	Provider    string
	Repo        string
	EventType   string
	Payload     string
	ProcessedAt *time.Time
	CreatedAt   time.Time
}

// APIKey maps to `api_keys` — supports the Public API major module.
type APIKey struct {
	ID        uuid.UUID
	ProjectID *uuid.UUID
	UserID    *uuid.UUID
	KeyHash   string
	RateLimit int
	CreatedAt time.Time
}
