// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: admin-facing user CRUD required by the Advanced permissions major module.
package permissions

import (
	"context"

	"ft-transcendence/internal/db"
)

// UpdateUserRequest is the validated shape of an admin user-edit request.
type UpdateUserRequest struct {
	Name   *string
	Avatar *string
}

// ListUsers returns all users, for the admin user-management view.
func ListUsers(ctx context.Context) ([]db.User, error) {
	// TODO: query all users via GORM; consider pagination once the user count grows
	return nil, nil
}

// GetUser fetches a single user by ID.
func GetUser(ctx context.Context, id uint) (*db.User, error) {
	// TODO: query User by primary key, return not-found error if absent
	return nil, nil
}

// UpdateUser applies an admin edit to a user's account (role changes go through AssignRole, not here).
func UpdateUser(ctx context.Context, id uint, req UpdateUserRequest) (*db.User, error) {
	// TODO: validate req fields, apply changes, save via GORM
	return nil, nil
}

// DeleteUser removes a user account, for admin moderation.
func DeleteUser(ctx context.Context, id uint) error {
	// TODO: cascade-consider: what happens to their cards/notes/attachments — reassign or soft-delete per team decision
	return nil
}
