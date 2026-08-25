// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: role definitions and role assignment for the Advanced permissions major module.
package permissions

import "context"

// Role is one of the project-scoped roles stored on project_members.role.
type Role string

const (
	RoleAdmin  Role = "admin"
	RoleMember Role = "member"
	RoleViewer Role = "viewer"
)

// AssignRole sets or updates a user's role within a project.
func AssignRole(ctx context.Context, projectID uint, userID uint, role Role) error {
	// TODO: upsert the (project_id, user_id) row in project_members with the given role
	// TODO: only an existing admin should be able to call this — enforce via RequireRole in the calling handler
	return nil
}

// GetUserRole looks up a user's role within a project, used by RequireRole and by frontend view-gating.
func GetUserRole(ctx context.Context, projectID uint, userID uint) (Role, error) {
	// TODO: query project_members for (project_id, user_id); return an error/empty role if the user isn't a member
	return "", nil
}
