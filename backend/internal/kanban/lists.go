// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for lists (Kanban columns) within a board.
package kanban

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateListRequest is the validated shape of a "new list" submission.
type CreateListRequest struct {
	BoardID uint
	Title   string
}

// UpdateListRequest is the validated shape of a list edit.
type UpdateListRequest struct {
	Title    *string
	Position *int
}

// CreateList creates a new list (column) on a board.
func CreateList(ctx context.Context, req CreateListRequest) (*db.List, error) {
	// TODO: validate req via ValidateListInput (title required, board_id must exist)
	// TODO: insert List row, appended at the end of the board's list order
	return nil, nil
}

// UpdateList renames or repositions a list.
func UpdateList(ctx context.Context, id uint, req UpdateListRequest) (*db.List, error) {
	// TODO: apply title/position changes, save via GORM
	return nil, nil
}

// DeleteList removes a list and its cards.
func DeleteList(ctx context.Context, id uint) error {
	// TODO: cascade delete cards in this list; broadcast "list_deleted" via the WS hub
	return nil
}

// ReorderLists persists a new left-to-right ordering of a board's lists after a drag-and-drop reorder.
func ReorderLists(ctx context.Context, boardID uint, orderedListIDs []uint) error {
	// TODO: update each list's position field to match orderedListIDs
	return nil
}
