// Owner: Track 2, Person A (Foundation, Auth, and API infrastructure)
// Responsible for: create/edit/delete for projects (organizations) — the Organization system major module. Unclaimed by any other track in the GitHub management plan, grouped here since it underpins the permissions/project_members model Track 1 already owns.
package projects

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateProjectRequest is the validated shape of a "new project" form submission.
type CreateProjectRequest struct {
	Name string
}

// UpdateProjectRequest is the validated shape of a project edit.
type UpdateProjectRequest struct {
	Name *string
}

// CreateProject creates a new project (organization) and makes the creator its owner/admin member.
func CreateProject(ctx context.Context, ownerID uint, req CreateProjectRequest) (*db.Project, error) {
	// TODO: validate req.Name (required, length limits) — backend half of dual validation requirement
	// TODO: insert Project row with OwnerID = ownerID
	// TODO: insert a ProjectMember row for ownerID with RoleAdmin
	return nil, nil
}

// GetProject fetches a project by ID, checking the caller is a member (enforced by permissions middleware upstream).
func GetProject(ctx context.Context, id uint) (*db.Project, error) {
	// TODO: query Project by primary key
	return nil, nil
}

// UpdateProject edits a project's editable fields (name, etc.).
func UpdateProject(ctx context.Context, id uint, req UpdateProjectRequest) (*db.Project, error) {
	// TODO: validate and apply changes; only admins should reach this (enforced via RequireRole)
	return nil, nil
}

// DeleteProject removes a project and cascades to its boards/lists/cards/notes/attachments.
func DeleteProject(ctx context.Context, id uint) error {
	// TODO: decide and implement cascade delete or soft-delete strategy for all owned entities
	return nil
}

// ListProjectsForUser returns every project a given user is a member of, for the project switcher UI.
func ListProjectsForUser(ctx context.Context, userID uint) ([]db.Project, error) {
	// TODO: join project_members -> projects for the given user_id
	return nil, nil
}
