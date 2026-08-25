// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for boards, one per project.
package kanban

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateBoardRequest is the validated shape of a "new board" submission.
type CreateBoardRequest struct {
	ProjectID uint
	Title     string
}

// CreateBoard creates a new board within a project.
func CreateBoard(ctx context.Context, req CreateBoardRequest) (*db.Board, error) {
	// TODO: validate req via ValidateBoardInput
	// TODO: insert Board row via GORM
	return nil, nil
}

// GetBoard fetches a board by ID, for the Kanban page load.
func GetBoard(ctx context.Context, id uint) (*db.Board, error) {
	// TODO: query Board by primary key, include its lists/cards for the initial render
	return nil, nil
}

// DeleteBoard removes a board and its lists/cards.
func DeleteBoard(ctx context.Context, id uint) error {
	// TODO: cascade delete lists and cards belonging to this board
	// TODO: broadcast a "board_deleted" event via Track 2 Person B's hub so open clients react
	return nil
}
