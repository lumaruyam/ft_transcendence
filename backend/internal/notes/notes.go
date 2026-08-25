// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: notes CRUD and the autosave endpoint, storing content as JSON with last-save-wins conflict resolution.
package notes

import (
	"context"

	"ft-transcendence/internal/db"
)

// GetLatestNote loads the current saved note for a project, for whoever opens the notes page.
func GetLatestNote(ctx context.Context, projectID uint) (*db.Note, error) {
	// TODO: query the notes row for project_id (one shared note per project, per the plan's scope)
	return nil, nil
}

// AutosaveNote persists a debounced edit from the Tiptap editor.
func AutosaveNote(ctx context.Context, projectID uint, userID uint, contentJSON string) (*db.Note, error) {
	// TODO: validate contentJSON is well-formed structured data
	// TODO: overwrite the note's content_json/updated_by/updated_at — last save wins, no conflict resolution by design
	// TODO: fire a notification via Track 4's notifications package ("note updated")
	return nil, nil
}
