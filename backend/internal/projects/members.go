// Owner: Track 2, Person A (Foundation, Auth, and API infrastructure)
// Responsible for: adding/removing members within a project, part of the Organization system major module.
package projects

import (
	"context"

	"ft-transcendence/internal/db"
	"ft-transcendence/internal/permissions"
)

// AddMember adds a user to a project with a given role.
func AddMember(ctx context.Context, projectID uint, userID uint, role permissions.Role) error {
	// TODO: verify the target user exists; verify the caller is an admin of the project (enforced upstream)
	// TODO: insert the project_members row via permissions.AssignRole
	return nil
}

// RemoveMember removes a user's membership from a project.
func RemoveMember(ctx context.Context, projectID uint, userID uint) error {
	// TODO: delete the project_members row; disallow removing the last remaining admin
	return nil
}

// ListMembers returns every member of a project along with their role, for the members management view.
func ListMembers(ctx context.Context, projectID uint) ([]db.ProjectMember, error) {
	// TODO: query project_members for project_id, join users for display name/avatar
	return nil, nil
}
