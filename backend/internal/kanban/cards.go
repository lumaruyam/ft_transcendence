// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend data model and CRUD for cards, including the linked-branch field populated by Track 3.
package kanban

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateCardRequest is the validated shape of a "new card" submission from the card detail view.
type CreateCardRequest struct {
	ListID      uint
	Title       string
	Description string
	Assignee    *uint
}

// UpdateCardRequest is the validated shape of a card edit.
type UpdateCardRequest struct {
	Title       *string
	Description *string
	Assignee    *uint
}

// CreateCard creates a new card in a list.
func CreateCard(ctx context.Context, req CreateCardRequest) (*db.Card, error) {
	// TODO: validate req via ValidateCardInput (title required, list_id must exist and belong to the caller's project)
	// TODO: insert new card row via GORM
	// TODO: broadcast "card_created" event over WebSocket to the project room (Track 2 Person B's hub)
	// TODO: return created card or validation/db error
	return nil, nil
}

// UpdateCard edits a card's title/description/assignee/linked branch fields.
func UpdateCard(ctx context.Context, id uint, req UpdateCardRequest) (*db.Card, error) {
	// TODO: validate req, apply changes via GORM
	// TODO: broadcast "card_updated" event via the WS hub
	return nil, nil
}

// MoveCard relocates a card to a new list/position, driving the drag-and-drop UI.
func MoveCard(ctx context.Context, cardID uint, newListID uint, newPosition int) (*db.Card, error) {
	// TODO: validate the destination list belongs to the same project
	// TODO: update list_id/position; this must be race-safe under concurrent moves per the mandatory multi-user requirement
	// TODO: broadcast "card_moved" event via the WS hub
	return nil, nil
}

// DeleteCard removes a card.
func DeleteCard(ctx context.Context, id uint) error {
	// TODO: delete the card row and any dependent attachments/git_links
	// TODO: broadcast "card_deleted" event via the WS hub
	return nil
}
